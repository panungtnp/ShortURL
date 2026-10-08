import { Router } from 'express';
import { pool } from '../db.js';
import { generateUniqueCode } from '../lib/code.js';
import { ALIAS_RE, isValidHttpUrl, parseExpiry } from '../lib/validate.js';

const router = Router();
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function shortUrlOf(req, code) {
  const base = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  return `${base}/${code}`;
}

// POST /api/links — create a short URL
// Body: { longUrl, customAlias?, expiresAt? }
router.post('/', async (req, res) => {
  const { longUrl, customAlias, expiresAt } = req.body ?? {};

  if (!isValidHttpUrl(longUrl)) {
    return res.status(400).json({ error: 'INVALID_URL', message: 'URL must be a public http(s) URL (max 2048 chars).' });
  }

  const expiry = parseExpiry(expiresAt);
  if (!expiry.ok) {
    return res.status(400).json({ error: expiry.error, message: 'expiresAt must be a future datetime.' });
  }

  try {
    let code;
    let isAlias = false;

    if (customAlias) {
      if (!ALIAS_RE.test(customAlias)) {
        return res.status(400).json({
          error: 'INVALID_ALIAS',
          message: 'Alias must be 3-30 chars: A-Z a-z 0-9 _ -',
        });
      }
      const { rows } = await pool.query('SELECT 1 FROM links WHERE code = $1', [customAlias]);
      if (rows.length > 0) {
        return res.status(409).json({ error: 'ALIAS_TAKEN', message: 'This alias is already taken.' });
      }
      code = customAlias;
      isAlias = true;
    } else {
      code = await generateUniqueCode(pool);
    }

    const { rows } = await pool.query(
      `INSERT INTO links (code, long_url, is_alias, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, long_url, is_alias, expires_at, created_at`,
      [code, longUrl, isAlias, expiry.date ? expiry.date.toISOString() : null]
    );
    const link = rows[0];
    return res.status(201).json({
      id: link.id,
      code: link.code,
      longUrl: link.long_url,
      shortUrl: shortUrlOf(req, link.code),
      qrPayload: shortUrlOf(req, link.code),
      isAlias: link.is_alias,
      expiresAt: link.expires_at,
      createdAt: link.created_at,
    });
  } catch (err) {
    // Race on alias insert → unique violation reads as conflict.
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'ALIAS_TAKEN', message: 'This alias is already taken.' });
    }
    console.error('POST /api/links failed', err);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create short URL.' });
  }
});

// GET /api/links — recent history with click counts
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  try {
    const params = [];
    let where = '';
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE l.code ILIKE $1 OR l.long_url ILIKE $1`;
    }
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT l.id, l.code, l.long_url, l.is_alias, l.expires_at, l.created_at,
              COUNT(c.id)::int AS click_count
       FROM links l
       LEFT JOIN clicks c ON c.link_id = l.id
       ${where}
       GROUP BY l.id
       ORDER BY l.created_at DESC
       LIMIT $${params.length}`,
      params
    );
    const base = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    return res.json({
      items: rows.map((r) => ({
        id: r.id,
        code: r.code,
        longUrl: r.long_url,
        shortUrl: `${base}/${r.code}`,
        isAlias: r.is_alias,
        clickCount: r.click_count,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('GET /api/links failed', err);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to load history.' });
  }
});

// GET /api/links/check?code=xxx — alias availability (route must sit before /:id/stats)
router.get('/check', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!ALIAS_RE.test(code)) return res.json({ available: false, reason: 'INVALID_ALIAS' });
  try {
    const { rows } = await pool.query('SELECT 1 FROM links WHERE code = $1', [code]);
    return res.json({ available: rows.length === 0 });
  } catch (err) {
    console.error('GET /api/links/check failed', err);
    return res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /api/links/:id/stats — totals + per-day + recent clicks
router.get('/:id/stats', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'INVALID_ID' });
  try {
    const { rows: linkRows } = await pool.query('SELECT * FROM links WHERE id = $1', [id]);
    if (linkRows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' });
    const link = linkRows[0];

    const [{ rows: totalRows }, { rows: byDay }, { rows: recent }] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM clicks WHERE link_id = $1', [id]),
      pool.query(
        `SELECT to_char(clicked_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
         FROM clicks WHERE link_id = $1 AND clicked_at >= now() - interval '30 days'
         GROUP BY 1 ORDER BY 1`,
        [id]
      ),
      pool.query(
        `SELECT clicked_at, ip, user_agent, referrer FROM clicks
         WHERE link_id = $1 ORDER BY clicked_at DESC LIMIT 20`,
        [id]
      ),
    ]);

    return res.json({
      id: link.id,
      code: link.code,
      longUrl: link.long_url,
      totalClicks: totalRows[0].total,
      byDay,
      recentClicks: recent,
    });
  } catch (err) {
    console.error('GET /api/links/:id/stats failed', err);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to load stats.' });
  }
});

export default router;

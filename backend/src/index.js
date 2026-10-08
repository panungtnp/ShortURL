import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import linksRouter from './routes/links.js';

dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '32kb' }));

const CODE_RE = /^[A-Za-z0-9_-]{1,30}$/;
const RESERVED = new Set(['api', 'health', 'favicon.ico']);

// Self-init tables so free-host deploys work without a manual psql step.
// db/schema.sql remains the source of truth for review/diagrams.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      long_url TEXT NOT NULL,
      is_alias BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS clicks (
      id SERIAL PRIMARY KEY,
      link_id INT NOT NULL REFERENCES links (id) ON DELETE CASCADE,
      clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip TEXT NULL,
      user_agent TEXT NULL,
      referrer TEXT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_links_code ON links (code);
    CREATE INDEX IF NOT EXISTS idx_clicks_link_time ON clicks (link_id, clicked_at DESC);
  `);
}

app.get('/health', (req, res) => res.json({ ok: true }));

// Friendly root so opening the API URL in a browser doesn't show "Cannot GET /".
app.get('/', (req, res) =>
  res.json({
    name: 'short-url API',
    health: '/health',
    create: 'POST /api/links',
    redirect: 'GET /:code',
    docs: 'https://github.com — see README',
  })
);

app.use('/api/links', linksRouter);

// GET /:code — redirect + count the click
app.get('/:code', async (req, res) => {
  const { code } = req.params;
  if (!CODE_RE.test(code) || RESERVED.has(code)) {
    return res.status(404).send('Not found');
  }
  try {
    const { rows } = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    if (rows.length === 0) return res.status(404).send('Short URL not found');
    const link = rows[0];

    if (link.expires_at && new Date(link.expires_at) <= new Date()) {
      return res
        .status(410)
        .send('This short URL has expired. Create a new one from the homepage.');
    }

    const ip =
      (req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip ?? '').slice(0, 64);
    const userAgent = (req.get('user-agent') ?? '').slice(0, 512);
    const referrer = (req.get('referer') ?? req.get('referrer') ?? '').slice(0, 1024);

    // Count the click, then redirect. Awaited so no clicks are lost on free tiers.
    await pool.query(
      'INSERT INTO clicks (link_id, ip, user_agent, referrer) VALUES ($1, $2, $3, $4)',
      [link.id, ip || null, userAgent || null, referrer || null]
    );

    return res.redirect(302, link.long_url);
  } catch (err) {
    console.error('GET /:code failed', err);
    return res.status(500).send('Internal error');
  }
});

const port = Number.parseInt(process.env.PORT, 10) || 3001;
initDb()
  .then(() => {
    app.listen(port, () => console.log(`short-url API listening on :${port}`));
  })
  .catch((err) => {
    console.error('Failed to init DB', err);
    process.exit(1);
  });

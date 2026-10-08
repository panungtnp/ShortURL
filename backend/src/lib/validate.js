export const ALIAS_RE = /^[A-Za-z0-9_-]{3,30}$/;
const MAX_URL_LENGTH = 2048;

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0') return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

// Only public http(s) URLs, max 2048 chars. Rejects credentials in URL
// and loopback/private targets (basic SSRF guard for a demo service).
export function isValidHttpUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL_LENGTH) return false;
  let u;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  if (isPrivateHostname(u.hostname)) return false;
  return true;
}

export function parseExpiry(value) {
  if (value === undefined || value === null || value === '') return { ok: true, date: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { ok: false, error: 'INVALID_EXPIRY' };
  if (d <= new Date()) return { ok: false, error: 'EXPIRY_IN_PAST' };
  return { ok: true, date: d };
}

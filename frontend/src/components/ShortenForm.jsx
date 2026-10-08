import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ALIAS_RE = /^[A-Za-z0-9_-]{3,30}$/;

export default function ShortenForm({ onCreated }) {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [aliasStatus, setAliasStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customAlias) return setAliasStatus(null);
    if (!ALIAS_RE.test(customAlias)) {
      return setAliasStatus({ type: 'error', text: 'ใช้ A-Z, a-z, 0-9, _ หรือ - จำนวน 3–30 ตัวอักษร' });
    }
    const timeout = window.setTimeout(async () => {
      try {
        const data = await api.checkAlias(customAlias);
        setAliasStatus(data.available
          ? { type: 'success', text: 'Alias นี้ใช้งานได้' }
          : { type: 'error', text: 'Alias นี้ถูกใช้หรือรูปแบบไม่ถูกต้อง' });
      } catch {
        setAliasStatus(null);
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [customAlias]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const link = await api.createLink({
        longUrl: longUrl.trim(),
        customAlias: customAlias.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      onCreated(link);
      setLongUrl('');
      setCustomAlias('');
      setExpiresAt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="shorten-form" onSubmit={submit} noValidate>
      <label htmlFor="longUrl">URL ปลายทาง <span>*</span></label>
      <input id="longUrl" type="url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)}
        placeholder="https://www.synerry.com" required />
      <p className="field-hint">รองรับเฉพาะ public HTTP/HTTPS URL</p>

      <div className="form-grid">
        <div>
          <label htmlFor="alias">Custom alias <small>(ไม่บังคับ)</small></label>
          <input id="alias" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)}
            placeholder="my-campaign" maxLength="30" />
          {aliasStatus && <p className={`field-status ${aliasStatus.type}`}>{aliasStatus.text}</p>}
        </div>
        <div>
          <label htmlFor="expiry">วันหมดอายุ <small>(ไม่บังคับ)</small></label>
          <input id="expiry" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      <button className="button primary create-button" disabled={loading}>
        {loading ? 'กำลังสร้าง…' : 'สร้าง Short URL'}
      </button>
    </form>
  );
}

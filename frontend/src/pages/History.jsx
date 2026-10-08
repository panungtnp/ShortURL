import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import QrCard from '../components/QrCard.jsx';

export default function History() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.listLinks(query);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <div className="page-heading">
        <div><p className="eyebrow">Your links</p><h1>ประวัติลิงก์</h1><p>รายการ Short URL ทั้งหมดและจำนวนการคลิก</p></div>
        <Link className="button primary" to="/">+ สร้างลิงก์</Link>
      </div>
      <div className="toolbar">
        <input aria-label="ค้นหาลิงก์" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา URL หรือ alias…" />
        <button className="button secondary" onClick={load}>รีเฟรช</button>
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Short URL</th><th>URL ปลายทาง</th><th>คลิก</th><th>สร้างเมื่อ</th><th>หมดอายุ</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => <tr key={item.id}>
              <td><a className="table-short" href={item.shortUrl} target="_blank" rel="noreferrer">{item.code}</a>{item.isAlias && <span className="badge">alias</span>}</td>
              <td className="url-cell" title={item.longUrl}>{item.longUrl}</td>
              <td><strong>{item.clickCount}</strong></td>
              <td>{new Date(item.createdAt).toLocaleDateString('th-TH')}</td>
              <td>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString('th-TH') : '—'}</td>
              <td><button className="text-button" onClick={() => setSelected(selected?.id === item.id ? null : item)}>{selected?.id === item.id ? 'ปิด QR' : 'ดู QR'}</button></td>
            </tr>)}
            {!items.length && !error && <tr><td colSpan="6" className="empty-state">ยังไม่มีลิงก์ ลองสร้าง Short URL แรกของคุณ</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && <div className="inline-qr"><QrCard shortUrl={selected.shortUrl} title={`QR Code · ${selected.code}`} /></div>}
    </div>
  );
}

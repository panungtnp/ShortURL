import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ClicksChart from '../components/ClicksChart.jsx';

export default function Stats() {
  const [links, setLinks] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listLinks()
      .then((data) => {
        setLinks(data.items || []);
        if (data.items?.length && !selectedId) setSelectedId(String(data.items[0].id));
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = useCallback(async (id) => {
    if (!id) return;
    try {
      setError('');
      const data = await api.linkStats(id);
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadStats(selectedId); }, [selectedId, loadStats]);

  const selected = links.find((l) => String(l.id) === String(selectedId));

  return (
    <div className="page">
      <div className="page-heading">
        <div><p className="eyebrow">Analytics</p><h1>สถิติการคลิก</h1><p>เลือก Short URL เพื่อดูยอดคลิกย้อนหลัง 30 วัน</p></div>
        <Link className="button primary" to="/">+ สร้างลิงก์</Link>
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <form className="toolbar" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="linkSelect">Short URL</label>
        <select id="linkSelect" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {links.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.clickCount} คลิก</option>)}
        </select>
      </form>
      {!links.length && !error && <p className="empty-state">ยังไม่มีลิงก์ให้ดูสถิติ — <Link to="/">สร้างลิงก์แรก</Link></p>}
      {stats && selected && (
        <div className="stats-grid">
          <section className="stat-tile"><p className="stat-label">ยอดคลิกทั้งหมด</p><p className="stat-value">{stats.totalClicks}</p></section>
          <section className="stat-tile"><p className="stat-label">Short URL</p><p className="stat-link"><a href={selected.shortUrl} target="_blank" rel="noreferrer">{selected.shortUrl}</a></p><p className="stat-dest">{selected.longUrl}</p></section>
          <section className="chart-panel"><ClicksChart data={stats.byDay} /></section>
          <section className="recent-panel">
            <h2>คลิกล่าสุด (20 รายการ)</h2>
            {stats.recentClicks.length ? (
              <table>
                <thead><tr><th>เวลา</th><th>Referrer</th><th>User Agent</th></tr></thead>
                <tbody>
                  {stats.recentClicks.map((c, i) => <tr key={i}>
                    <td>{new Date(c.clicked_at).toLocaleString('th-TH')}</td>
                    <td className="url-cell">{c.referrer || '—'}</td>
                    <td className="url-cell">{c.user_agent || '—'}</td>
                  </tr>)}
                </tbody>
              </table>
            ) : <p className="empty-state">ยังไม่มีการคลิก</p>}
          </section>
        </div>
      )}
    </div>
  );
}

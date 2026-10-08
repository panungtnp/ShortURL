import { useMemo, useState } from 'react';

// Single-series line chart: clicks per day (change-over-time).
// Design tokens follow the dataviz reference palette:
// series blue #2a78d6 (light) / #3987e5 (dark), ink via CSS vars,
// 2px line, >=8px markers, recessive grid, crosshair + tooltip on hover.
export default function ClicksChart({ data = [] }) {
  const [hover, setHover] = useState(null);

  const W = 640;
  const H = 260;
  const PAD = { top: 16, right: 16, bottom: 32, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const { points, maxCount, yTicks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.count));
    const nice = Math.max(1, Math.ceil(max / 4) * 4 || max);
    const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((nice * i) / 4));
    const pts = data.map((d, i) => ({
      ...d,
      x: data.length === 1 ? PAD.left + innerW / 2 : PAD.left + (innerW * i) / (data.length - 1),
      y: PAD.top + innerH - (innerH * d.count) / nice,
    }));
    return { points: pts, maxCount: nice, yTicks: ticks };
  }, [data, innerW, innerH]);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  if (!data.length) {
    return <p className="empty-state">ยังไม่มีข้อมูลคลิกในช่วง 30 วันที่ผ่านมา</p>;
  }

  return (
    <figure className="viz-root" aria-label="กราฟจำนวนคลิกรายวัน">
      <figcaption className="viz-title">จำนวนคลิกรายวัน (30 วันล่าสุด)</figcaption>
      <div className="viz-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * W;
            let best = 0;
            let bestDist = Infinity;
            points.forEach((p, i) => {
              const dist = Math.abs(p.x - mx);
              if (dist < bestDist) { bestDist = dist; best = i; }
            });
            setHover(best);
          }}
        >
          {yTicks.map((t) => {
            const y = PAD.top + innerH - (innerH * t) / maxCount;
            return (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="viz-grid" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="viz-tick">{t}</text>
              </g>
            );
          })}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} className="viz-baseline" />
          <path d={path} fill="none" className="viz-line" strokeWidth="2" />
          {points.map((p, i) => (
            <g key={p.date}>
              <circle cx={p.x} cy={p.y} r={hover === i ? 6 : 4} className={hover === i ? 'viz-dot active' : 'viz-dot'} />
              <rect
                x={p.x - 14}
                y={0}
                width={28}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              >
                <title>{`${p.date}: ${p.count} คลิก`}</title>
              </rect>
              {(i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0) && (
                <text x={p.x} y={H - 8} textAnchor="middle" className="viz-tick">{p.date.slice(5)}</text>
              )}
            </g>
          ))}
          {hover !== null && points[hover] && (
            <line
              x1={points[hover].x}
              x2={points[hover].x}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="viz-crosshair"
            />
          )}
        </svg>
        {hover !== null && points[hover] && (
          <div className="viz-tooltip" role="status">
            <strong>{points[hover].date}</strong>
            <span>{points[hover].count} คลิก</span>
          </div>
        )}
      </div>
      <details className="viz-table">
        <summary>ดูข้อมูลแบบตาราง</summary>
        <table>
          <thead><tr><th>วันที่</th><th>คลิก</th></tr></thead>
          <tbody>
            {data.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.count}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

export default function QrCard({ shortUrl, title = 'QR Code' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this URL:', shortUrl);
    }
  }

  function downloadQr() {
    const svg = document.getElementById(`qr-${shortUrl}`);
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'short-url-qr.svg';
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <section className="qr-card" aria-label={title}>
      <QRCodeSVG id={`qr-${shortUrl}`} value={shortUrl} size={152} level="M" includeMargin />
      <div className="qr-meta">
        <p className="eyebrow">{title}</p>
        <a className="short-url" href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
        <div className="button-row">
          <button className="button secondary" onClick={copy}>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</button>
          <button className="button ghost" onClick={downloadQr}>ดาวน์โหลด QR</button>
        </div>
      </div>
    </section>
  );
}

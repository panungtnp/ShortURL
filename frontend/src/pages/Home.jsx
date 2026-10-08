import { useState } from 'react';
import ShortenForm from '../components/ShortenForm.jsx';
import QrCard from '../components/QrCard.jsx';

export default function Home() {
  const [created, setCreated] = useState(null);

  return (
    <div className="page home-page">
      <section className="hero">
        <p className="eyebrow">Simple links. Clear insight.</p>
        <h1>ย่อลิงก์ให้สั้น<br />และติดตามผลได้</h1>
        <p className="hero-copy">สร้าง Short URL, QR Code และดูสถิติการคลิกได้ในที่เดียว</p>
      </section>
      <section className="create-panel">
        <ShortenForm onCreated={setCreated} />
        {created && (
          <div className="result-panel">
            <div className="result-heading">
              <span className="success-icon">✓</span>
              <div><h2>สร้าง Short URL สำเร็จ</h2><p>ลิงก์พร้อมใช้งานแล้ว</p></div>
            </div>
            <QrCard shortUrl={created.shortUrl} title="QR Code ของลิงก์นี้" />
            {created.expiresAt && <p className="expiry-note">หมดอายุ: {new Date(created.expiresAt).toLocaleString('th-TH')}</p>}
          </div>
        )}
      </section>
      <section className="feature-grid" aria-label="Features">
        <article><span>01</span><h2>Short URL</h2><p>สร้างลิงก์สั้น พร้อมตั้งชื่อ alias เองได้</p></article>
        <article><span>02</span><h2>QR Code</h2><p>สร้างและดาวน์โหลด QR Code สำหรับทุกลิงก์</p></article>
        <article><span>03</span><h2>Analytics</h2><p>เก็บประวัติและยอดคลิก เพื่อวัดผลได้ทันที</p></article>
      </section>
    </div>
  );
}

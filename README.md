# Short URL — Synerry Developer Test

ระบบย่อ URL พร้อม QR Code, ประวัติการสร้าง และสถิติการคลิก
Stack: **Node.js (Express) + React (Vite) + PostgreSQL**

## ฟีเจอร์ตามเกณฑ์

| เกณฑ์ | สิ่งที่ทำ |
|---|---|
| 3. สร้าง Short URL | ฟอร์มหน้าแรก → ได้ `BASE_URL/<code>` (สุ่ม 5 ตัวอักษรแบบ `rAJMO`) → เปิดแล้ว redirect 302 จริง |
| 4. QR Code | QR แสดงพร้อมผลลัพธ์ทุกครั้ง + ในหน้าประวัติ, ปุ่มดาวน์โหลด SVG, สแกนแล้วไป URL ต้นฉบับ |
| 5. ประวัติ + สถิติ | หน้า History (ตาราง + ยอดคลิก + ค้นหา) และหน้า Stats (ยอดรวม, กราฟรายวัน 30 วัน, คลิกล่าสุด) |
| 6. เสริม (พิเศษ) | Custom alias (ตรวจซ้ำแบบ live), วันหมดอายุ (หมดอายุแล้วคืน 410), Dashboard สถิติ |
| 1–2. เอกสาร | `docs/dfd-level0.mmd`, `docs/er-diagram.mmd`, `docs/architecture.mmd` (render เป็น PNG ด้วย Mermaid Live Editor หรือ `mmdc`) |

## โครงโปรเจกต์

```
short-url/
├── frontend/   # React + Vite (Home / History / Stats)
├── backend/    # Express API + redirect + นับคลิก
├── db/schema.sql
├── docs/       # DFD Level 0, ER, Architecture (Mermaid)
└── docker-compose.yml
```

## ติดตั้ง (local)

ต้องการ: Node 20+, (ทางเลือก) Docker สำหรับ Postgres

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # แก้ DATABASE_URL / BASE_URL ตามจริง
npm run dev                 # http://localhost:3001

# 2. สร้างตาราง (ถ้าไม่ใช้ docker — backend มี self-init ให้อยู่แล้ว)
psql "$DATABASE_URL" -f ../db/schema.sql

# 3. Frontend (อีก terminal)
cd ../frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api ไป backend)
```

ทดสอบเร็ว:

```bash
curl -X POST localhost:3001/api/links -H 'Content-Type: application/json' \
  -d '{"longUrl":"https://www.synerry.com"}'
# → {"code":"rAJMO", "shortUrl":"http://localhost:3001/rAJMO", ...}
curl -i localhost:3001/rAJMO   # 302 → https://www.synerry.com
```

## Deploy (free host)

1. **DB:** สร้าง Postgres ฟรีที่ Neon / Supabase → copy `DATABASE_URL`
2. **Backend:** deploy โฟลเดอร์ `backend/` บน Render/Railway → ตั้ง env `DATABASE_URL`, `BASE_URL=<backend URL จริง>`
3. **Frontend:** deploy โฟลเดอร์ `frontend/` บน Vercel/Netlify → ตั้ง `VITE_API_BASE_URL=<backend URL>`
4. QR และ short link ใช้ `BASE_URL` จาก backend ตรง ๆ จึงสแกนจากมือถือได้ทันที

## API โดยย่อ

- `POST /api/links { longUrl, customAlias?, expiresAt? }` → `201` (ซ้ำ → `409`, ผิด format → `400`)
- `GET /:code` → `302` + บันทึกคลิก (หมดอายุ → `410`, ไม่เจอ → `404`)
- `GET /api/links?q=&limit=` → ประวัติพร้อมยอดคลิก
- `GET /api/links/check?code=` → ตรวจ alias ว่างหรือไม่
- `GET /api/links/:id/stats` → ยอดรวม + รายวัน 30 วัน + คลิกล่าสุด 20 รายการ
# ShortLink
# ShortURL

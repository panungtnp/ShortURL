import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL env var. Copy .env.example to .env first.');
  process.exit(1);
}

// Managed Postgres (Neon/Supabase/Render) requires TLS.
const needsSSL =
  /sslmode=require/i.test(connectionString) ||
  /neon|supabase/i.test(connectionString) ||
  process.env.PGSSL === 'true';

export const pool = new Pool({
  connectionString,
  ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('error', (err) => {
  console.error('pg pool error', err);
});

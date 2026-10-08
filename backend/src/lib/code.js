import { customAlphabet } from 'nanoid';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid5 = customAlphabet(ALPHABET, 5);
const nanoid7 = customAlphabet(ALPHABET, 7);

// Style like the spec example: short codes such as "rAJMO".
export async function generateUniqueCode(db) {
  for (let i = 0; i < 10; i++) {
    const code = nanoid5();
    const { rows } = await db.query('SELECT 1 FROM links WHERE code = $1', [code]);
    if (rows.length === 0) return code;
  }
  // Extremely unlikely fallback: longer code space.
  for (;;) {
    const code = nanoid7();
    const { rows } = await db.query('SELECT 1 FROM links WHERE code = $1', [code]);
    if (rows.length === 0) return code;
  }
}

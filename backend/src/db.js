import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString || typeof connectionString !== 'string') {
  throw new Error('DATABASE_URL muhit o\'zgarmasini aniqlab bo\'lmadi. backend/.env faylini tekshiring.');
}

const isProduction = process.env.NODE_ENV === 'production';
const forceSsl = process.env.DB_SSL === 'true' || connectionString.includes('sslmode=require');

const pool = new Pool({
  connectionString,
  ssl: (isProduction || forceSsl) ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('DB QUERY', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;

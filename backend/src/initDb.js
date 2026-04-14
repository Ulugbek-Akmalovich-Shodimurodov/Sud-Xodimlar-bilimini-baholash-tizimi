import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  try {
    const sqlPath = path.resolve(__dirname, '../db/init.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    await query(sql);
    console.log('Database initialization SQL applied successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

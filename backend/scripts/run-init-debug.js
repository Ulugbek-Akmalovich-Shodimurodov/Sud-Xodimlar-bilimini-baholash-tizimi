import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sqlPath = path.resolve(__dirname, '..', 'db', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const parts = sql.split(/;\s*\n/);
  for (let i = 0; i < parts.length; i++) {
    const s = parts[i].trim();
    if (!s) continue;
    try {
      await query(s);
      console.log('OK stmt', i);
    } catch (e) {
      console.error('ERR at stmt', i, e.message);
      console.error('STATEMENT:\n', s);
      process.exit(1);
    }
  }
  console.log('ALL DONE');
}

run().catch((e) => { console.error('RUN FAILED', e.message); process.exit(1); });

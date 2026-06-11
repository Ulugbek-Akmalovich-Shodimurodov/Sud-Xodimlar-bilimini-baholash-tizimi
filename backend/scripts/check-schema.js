import { query } from '../src/db.js';

async function run() {
  try {
    const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name='employees'");
    console.log('employees columns:', cols.rows.map(r => r.column_name));
    const cnt = await query("SELECT COUNT(*) AS c FROM criteria");
    console.log('criteria count:', cnt.rows[0].c);
    process.exit(0);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  }
}

run();

import bcrypt from 'bcrypt';
import { query } from '../src/db.js';

async function run() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await query('UPDATE admins SET password = $1 WHERE username = $2', [hash, 'superadmin']);
    console.log('Updated superadmin password');
    process.exit(0);
  } catch (e) {
    console.error('Error', e.message);
    process.exit(1);
  }
}

run();

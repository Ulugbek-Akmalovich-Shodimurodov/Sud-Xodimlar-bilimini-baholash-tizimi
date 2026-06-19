import { query } from '../src/db.js';

async function run() {
  try {
    const perms = ['employees.view','employees.create','employees.update','employees.delete','regions.manage','districts.manage','positions.manage','colleges.manage','criteria.manage'];
    const res = await query('UPDATE admins SET permissions = $1::jsonb WHERE username = $2', [JSON.stringify(perms), 'admin123']);
    console.log('Updated permissions, rowCount=', res.rowCount);
    process.exit(0);
  } catch (e) {
    console.error('Error', e.message);
    process.exit(1);
  }
}

run();

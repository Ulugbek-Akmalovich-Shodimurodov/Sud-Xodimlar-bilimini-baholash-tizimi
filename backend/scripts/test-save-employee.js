import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { query } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    const emp = await query('SELECT * FROM employees LIMIT 1');
    if (!emp.rows.length) {
      console.log('No employees in DB');
      process.exit(0);
    }
    const e = emp.rows[0];
    const adminId = 1;
    const token = jwt.sign({ id: adminId }, process.env.JWT_SECRET || 'replace_with_a_strong_secret');

    const payload = {
      full_name: e.full_name,
      position: e.position,
      region_id: e.region_id,
      district_id: e.district_id,
      scores: { legal_understanding: 55 }
    };

    const res = await fetch(`http://localhost:4000/api/employees/${e.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(()=>null);
    console.log('status', res.status);
    console.log('body', text || 'no-body');
    process.exit(0);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  }
}

run();

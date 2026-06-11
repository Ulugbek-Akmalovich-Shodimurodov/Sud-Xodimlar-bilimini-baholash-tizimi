import bcrypt from 'bcrypt';
import { query } from '../src/db.js';

async function run() {
  try {
    console.log('Default admin seeding has been disabled.');
    process.exit(0);
  } catch (e) {
    console.error('Seed admin error', e.message);
    process.exit(1);
  }
}

run();

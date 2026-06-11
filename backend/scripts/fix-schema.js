import { query } from '../src/db.js';

async function run() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS criteria (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      short_label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )`);
    console.log('criteria OK');

    await query(`CREATE TABLE IF NOT EXISTS criterion_sections (
      id SERIAL PRIMARY KEY,
      criterion_id INTEGER NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE (criterion_id, key)
    )`);
    console.log('criterion_sections OK');

    await query(`ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS scores JSONB NOT NULL DEFAULT '{}'::jsonb`);
    console.log('scores OK');

    await query(`ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS chosen_sections JSONB NOT NULL DEFAULT '{}'::jsonb`);
    console.log('chosen_sections OK');

    process.exit(0);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  }
}

run();

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  assigned_regions JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS employees DROP CONSTRAINT IF EXISTS employees_district_id_fkey;
ALTER TABLE IF EXISTS employees ADD CONSTRAINT employees_district_id_fkey FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at ON employees;

CREATE TRIGGER employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

INSERT INTO regions (name)
VALUES
  ('Toshkent viloyati'),
  ('Samarqand viloyati'),
  ('Farg''ona viloyati')
ON CONFLICT DO NOTHING;

INSERT INTO districts (name, region_id)
VALUES
  ('Shahar', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Qibray', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Samarqand shahar', (SELECT id FROM regions WHERE name = 'Samarqand viloyati'))
ON CONFLICT DO NOTHING;

INSERT INTO admins (username, password, role, assigned_regions)
VALUES
  ('superadmin', '$2b$10$9u2vaDbOu/CEhP0h6MtS7ONedfqCdnh8rt09FDd5d.R9xiQxQAYtW', 'super_admin', '[1,2,3]')
ON CONFLICT (username) DO NOTHING;

INSERT INTO positions (name)
VALUES
  ('Yuqori sud xodimi'),
  ('Yuridik mutaxassis'),
  ('Ma’muriyat xodimi'),
  ('Sud raisi'),
  ('Sudya')
ON CONFLICT DO NOTHING;

INSERT INTO employees (full_name, position, region_id, district_id, score)
VALUES
  (
    'Abdulla Axmedov',
    'Yuqori sud xodimi',
    (SELECT id FROM regions WHERE name = 'Toshkent viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Shahar' AND r.name = 'Toshkent viloyati' LIMIT 1),
    92
  ),
  (
    'Dilshod Mirzaev',
    'Yuridik mutaxassis',
    (SELECT id FROM regions WHERE name = 'Samarqand viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Samarqand shahar' AND r.name = 'Samarqand viloyati' LIMIT 1),
    78
  )
ON CONFLICT DO NOTHING;

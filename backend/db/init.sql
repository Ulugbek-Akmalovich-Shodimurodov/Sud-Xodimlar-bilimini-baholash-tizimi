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

CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('employee', 'admin', 'region', 'district', 'position')),
  entity_id INTEGER,
  entity_name TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  konstitutsiya_score INTEGER NOT NULL DEFAULT 0 CHECK (konstitutsiya_score >= 0 AND konstitutsiya_score <= 100),
  kodeks_score INTEGER NOT NULL DEFAULT 0 CHECK (kodeks_score >= 0 AND kodeks_score <= 100),
  protsessual_kodeks_score INTEGER NOT NULL DEFAULT 0 CHECK (protsessual_kodeks_score >= 0 AND protsessual_kodeks_score <= 100),
  akt_sohasi_score INTEGER NOT NULL DEFAULT 0 CHECK (akt_sohasi_score >= 0 AND akt_sohasi_score <= 100),
  odob_axloq_score INTEGER NOT NULL DEFAULT 0 CHECK (odob_axloq_score >= 0 AND odob_axloq_score <= 100),
  konstitutsiya_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (konstitutsiya_status IN ('topshirdi', 'topshirmadi')),
  kodeks_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (kodeks_status IN ('topshirdi', 'topshirmadi')),
  protsessual_kodeks_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (protsessual_kodeks_status IN ('topshirdi', 'topshirmadi')),
  akt_sohasi_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (akt_sohasi_status IN ('topshirdi', 'topshirmadi')),
  odob_axloq_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (odob_axloq_status IN ('topshirdi', 'topshirmadi')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS konstitutsiya_score INTEGER NOT NULL DEFAULT 0 CHECK (konstitutsiya_score >= 0 AND konstitutsiya_score <= 100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS kodeks_score INTEGER NOT NULL DEFAULT 0 CHECK (kodeks_score >= 0 AND kodeks_score <= 100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS protsessual_kodeks_score INTEGER NOT NULL DEFAULT 0 CHECK (protsessual_kodeks_score >= 0 AND protsessual_kodeks_score <= 100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS akt_sohasi_score INTEGER NOT NULL DEFAULT 0 CHECK (akt_sohasi_score >= 0 AND akt_sohasi_score <= 100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS odob_axloq_score INTEGER NOT NULL DEFAULT 0 CHECK (odob_axloq_score >= 0 AND odob_axloq_score <= 100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS konstitutsiya_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (konstitutsiya_status IN ('topshirdi', 'topshirmadi'));
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS kodeks_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (kodeks_status IN ('topshirdi', 'topshirmadi'));
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS protsessual_kodeks_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (protsessual_kodeks_status IN ('topshirdi', 'topshirmadi'));
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS akt_sohasi_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (akt_sohasi_status IN ('topshirdi', 'topshirmadi'));
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS odob_axloq_status TEXT NOT NULL DEFAULT 'topshirmadi' CHECK (odob_axloq_status IN ('topshirdi', 'topshirmadi'));

ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS admin_username TEXT NOT NULL;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE'));
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL CHECK (entity_type IN ('employee', 'admin', 'region', 'district', 'position'));
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS entity_id INTEGER;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS entity_name TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW();

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

INSERT INTO employees (
  full_name,
  position,
  region_id,
  district_id,
  score,
  konstitutsiya_score,
  kodeks_score,
  protsessual_kodeks_score,
  akt_sohasi_score,
  odob_axloq_score,
  konstitutsiya_status,
  kodeks_status,
  protsessual_kodeks_status,
  akt_sohasi_status,
  odob_axloq_status
)
VALUES
  (
    'Abdulla Axmedov',
    'Yuqori sud xodimi',
    (SELECT id FROM regions WHERE name = 'Toshkent viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Shahar' AND r.name = 'Toshkent viloyati' LIMIT 1),
    92,
    95, 90, 91, 0, 92,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirmadi', 'topshirdi'
  ),
  (
    'Dilshod Mirzaev',
    'Yuridik mutaxassis',
    (SELECT id FROM regions WHERE name = 'Samarqand viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Samarqand shahar' AND r.name = 'Samarqand viloyati' LIMIT 1),
    78,
    80, 76, 79, 0, 77,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirmadi', 'topshirdi'
  )
ON CONFLICT DO NOTHING;

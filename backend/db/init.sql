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

CREATE TABLE IF NOT EXISTS colleges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  assigned_regions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  entity_name TEXT,
  change_description TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
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
  college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  chosen_sections JSONB NOT NULL DEFAULT '{}'::jsonb,
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

CREATE TABLE IF NOT EXISTS criteria (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS college_criteria (
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  criterion_id INTEGER NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (college_id, criterion_id)
);

ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL;
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
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS scores JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS chosen_sections JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS admin_username TEXT NOT NULL;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE'));
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL CHECK (entity_type IN ('employee', 'admin', 'region', 'district', 'position'));
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS entity_id INTEGER;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS entity_name TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS change_description TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS admin_logs DROP CONSTRAINT IF EXISTS admin_logs_entity_type_check;
ALTER TABLE IF EXISTS admin_logs ADD CONSTRAINT admin_logs_entity_type_check CHECK (entity_type IN ('employee', 'admin', 'region', 'district', 'position', 'criterion', 'college'));

ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS admins DROP CONSTRAINT IF EXISTS admins_status_check;
ALTER TABLE IF EXISTS admins ADD CONSTRAINT admins_status_check CHECK (status IN ('active', 'blocked'));

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

INSERT INTO admins (username, password, role, assigned_regions)
VALUES
  ('superadmin', '$2b$10$9u2vaDbOu/CEhP0h6MtS7ONedfqCdnh8rt09FDd5d.R9xiQxQAYtW', 'super_admin', '[]')
ON CONFLICT (username) DO NOTHING;

-- Default non-admin seed data has been removed.

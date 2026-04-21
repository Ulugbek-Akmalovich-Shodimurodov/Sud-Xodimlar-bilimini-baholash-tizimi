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
ALTER TABLE IF EXISTS admin_logs ADD COLUMN IF NOT EXISTS change_description TEXT;
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
  ('Farg''ona viloyati'),
  ('Buxoro viloyati'),
  ('Xorazm viloyati'),
  ('Qashqadaryo viloyati'),
  ('Jizzax viloyati'),
  ('Navoiy viloyati'),
  ('Andijon viloyati'),
  ('Namangan viloyati'),
  ('Sirdaryo viloyati')
ON CONFLICT DO NOTHING;

INSERT INTO districts (name, region_id)
VALUES
  ('Toshkent shahar', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Chirchiq', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Qibray', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Angren', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Bekobod', (SELECT id FROM regions WHERE name = 'Toshkent viloyati')),
  ('Samarqand shahar', (SELECT id FROM regions WHERE name = 'Samarqand viloyati')),
  ('Bulung\'ur', (SELECT id FROM regions WHERE name = 'Samarqand viloyati')),
  ('Kattaqo\'rg\'on', (SELECT id FROM regions WHERE name = 'Samarqand viloyati')),
  ('Urgut', (SELECT id FROM regions WHERE name = 'Samarqand viloyati')),
  ('Farg\'ona shahar', (SELECT id FROM regions WHERE name = 'Farg\'ona viloyati')),
  ('Kokand', (SELECT id FROM regions WHERE name = 'Farg\'ona viloyati')),
  ('Quva', (SELECT id FROM regions WHERE name = 'Farg\'ona viloyati')),
  ('Buxoro shahar', (SELECT id FROM regions WHERE name = 'Buxoro viloyati')),
  ('Gijduvon', (SELECT id FROM regions WHERE name = 'Buxoro viloyati')),
  ('Kogon', (SELECT id FROM regions WHERE name = 'Buxoro viloyati')),
  ('Urganch', (SELECT id FROM regions WHERE name = 'Xorazm viloyati')),
  ('Xiva', (SELECT id FROM regions WHERE name = 'Xorazm viloyati')),
  ('Shovot', (SELECT id FROM regions WHERE name = 'Xorazm viloyati')),
  ('Qarshi', (SELECT id FROM regions WHERE name = 'Qashqadaryo viloyati')),
  ('Shahrisabz', (SELECT id FROM regions WHERE name = 'Qashqadaryo viloyati')),
  ('Kitob', (SELECT id FROM regions WHERE name = 'Qashqadaryo viloyati')),
  ('Jizzax shahar', (SELECT id FROM regions WHERE name = 'Jizzax viloyati')),
  ('Zarafshon', (SELECT id FROM regions WHERE name = 'Jizzax viloyati')),
  ('Gallaorol', (SELECT id FROM regions WHERE name = 'Jizzax viloyati')),
  ('Navoiy shahar', (SELECT id FROM regions WHERE name = 'Navoiy viloyati')),
  ('Qiziltepa', (SELECT id FROM regions WHERE name = 'Navoiy viloyati')),
  ('Nurota', (SELECT id FROM regions WHERE name = 'Navoiy viloyati')),
  ('Andijon shahar', (SELECT id FROM regions WHERE name = 'Andijon viloyati')),
  ('Xonobod', (SELECT id FROM regions WHERE name = 'Andijon viloyati')),
  ('Shahrixon', (SELECT id FROM regions WHERE name = 'Andijon viloyati')),
  ('Namangan shahar', (SELECT id FROM regions WHERE name = 'Namangan viloyati')),
  ('Chust', (SELECT id FROM regions WHERE name = 'Namangan viloyati')),
  ('Pop', (SELECT id FROM regions WHERE name = 'Namangan viloyati')),
  ('Guliston', (SELECT id FROM regions WHERE name = 'Sirdaryo viloyati')),
  ('Boyovut', (SELECT id FROM regions WHERE name = 'Sirdaryo viloyati')),
  ('Sirdaryo', (SELECT id FROM regions WHERE name = 'Sirdaryo viloyati'))
ON CONFLICT DO NOTHING;

INSERT INTO admins (username, password, role, assigned_regions)
VALUES
  ('superadmin', '$2b$10$9u2vaDbOu/CEhP0h6MtS7ONedfqCdnh8rt09FDd5d.R9xiQxQAYtW', 'super_admin', '[1,2,3]')
ON CONFLICT (username) DO NOTHING;

INSERT INTO positions (name)
VALUES
  ('Sud raisi'),
  ('Sudya'),
  ('Yuqori sud xodimi'),
  ('Yuridik mutaxassis'),
  ('Ma\'muriyat xodimi'),
  ('Prokuror'),
  ('Kotib'),
  ('Arxiv boshlig\'i'),
  ('Yuridik maslahatchi'),
  ('Ishchi kengash a\'zosi'),
  ('Sud majlisining kotibyati'),
  ('Sud ijrochisi')
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
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Toshkent shahar' AND r.name = 'Toshkent viloyati' LIMIT 1),
    92,
    95, 90, 91, 88, 92,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi'
  ),
  (
    'Dilshod Mirzaev',
    'Yuridik mutaxassis',
    (SELECT id FROM regions WHERE name = 'Samarqand viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Samarqand shahar' AND r.name = 'Samarqand viloyati' LIMIT 1),
    78,
    80, 76, 79, 75, 77,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirmadi', 'topshirdi'
  ),
  (
    'Gulnora Karimova',
    'Sud raisi',
    (SELECT id FROM regions WHERE name = 'Farg\'ona viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Farg\'ona shahar' AND r.name = 'Farg\'ona viloyati' LIMIT 1),
    88,
    90, 85, 87, 89, 86,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi'
  ),
  (
    'Bobur Rahimov',
    'Sudya',
    (SELECT id FROM regions WHERE name = 'Buxoro viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Buxoro shahar' AND r.name = 'Buxoro viloyati' LIMIT 1),
    85,
    88, 82, 84, 86, 83,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi'
  ),
  (
    'Zarina Toshpulatova',
    'Prokuror',
    (SELECT id FROM regions WHERE name = 'Xorazm viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Urganch' AND r.name = 'Xorazm viloyati' LIMIT 1),
    91,
    93, 89, 90, 92, 91,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi'
  ),
  (
    'Jamshid Yusupov',
    'Ma\'muriyat xodimi',
    (SELECT id FROM regions WHERE name = 'Qashqadaryo viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Qarshi' AND r.name = 'Qashqadaryo viloyati' LIMIT 1),
    76,
    78, 74, 77, 75, 76,
    'topshirmadi', 'topshirmadi', 'topshirdi', 'topshirmadi', 'topshirmadi'
  ),
  (
    'Mavzuna Aliyeva',
    'Yuridik maslahatchi',
    (SELECT id FROM regions WHERE name = 'Andijon viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Andijon shahar' AND r.name = 'Andijon viloyati' LIMIT 1),
    87,
    89, 85, 86, 88, 87,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi', 'topshirdi'
  ),
  (
    'Sardor Qodirov',
    'Arxiv boshlig\'i',
    (SELECT id FROM regions WHERE name = 'Namangan viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Namangan shahar' AND r.name = 'Namangan viloyati' LIMIT 1),
    82,
    84, 80, 83, 81, 82,
    'topshirdi', 'topshirmadi', 'topshirdi', 'topshirmadi', 'topshirdi'
  ),
  (
    'Nigora Azimova',
    'Kotib',
    (SELECT id FROM regions WHERE name = 'Jizzax viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Jizzax shahar' AND r.name = 'Jizzax viloyati' LIMIT 1),
    79,
    81, 77, 80, 78, 79,
    'topshirmadi', 'topshirdi', 'topshirmadi', 'topshirdi', 'topshirmadi'
  ),
  (
    'Rustam Sobirov',
    'Sud majlisining kotibyati',
    (SELECT id FROM regions WHERE name = 'Navoiy viloyati'),
    (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id WHERE d.name = 'Navoiy shahar' AND r.name = 'Navoiy viloyati' LIMIT 1),
    84,
    86, 82, 85, 83, 84,
    'topshirdi', 'topshirdi', 'topshirdi', 'topshirmadi', 'topshirdi'
  )
ON CONFLICT DO NOTHING;

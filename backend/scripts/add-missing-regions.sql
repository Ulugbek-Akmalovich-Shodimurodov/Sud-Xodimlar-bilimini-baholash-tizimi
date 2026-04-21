INSERT INTO regions (name) VALUES 
  ('Buxoro viloyati'),
  ('Xorazm viloyati'),
  ('Qashqadaryo viloyati'),
  ('Jizzax viloyati'),
  ('Navoiy viloyati'),
  ('Andijon viloyati'),
  ('Namangan viloyati'),
  ('Sirdaryo viloyati')
ON CONFLICT (name) DO NOTHING;

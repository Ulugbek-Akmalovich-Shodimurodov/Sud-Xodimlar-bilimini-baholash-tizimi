# Supreme Court Employee Knowledge Assessment System

## Loyihalar tuzilishi

- `backend/` - Express.js backend
- `frontend/` - React + Tailwind CSS frontend
- `backend/db/init.sql` - PostgreSQL schema va boshlang‘ich ma'lumotlar
- `backend/.env.example` - muhit konfiguratsiyasi
- `frontend/.env.example` - frontend muhit konfiguratsiyasi
- `DEPLOY.md` - GitHub va free hosting bo'yicha yo'riqnoma

## Texnologiyalar

- Backend: Node.js, Express.js, PostgreSQL, JWT, bcrypt, Joi
- Frontend: React, Vite, Tailwind CSS, Recharts
- Tillar: O‘zbekcha UI

## Database sxemasi

### `regions`
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL UNIQUE

### `districts`
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `region_id` INTEGER REFERENCES regions(id)

### `admins`
- `id` SERIAL PRIMARY KEY
- `username` TEXT NOT NULL UNIQUE
- `password` TEXT NOT NULL (hashed)
- `role` TEXT CHECK (role IN ('super_admin', 'admin'))
- `assigned_regions` JSONB NOT NULL DEFAULT '[]'

### `employees`
- `id` SERIAL PRIMARY KEY
- `full_name` TEXT NOT NULL
- `position` TEXT NOT NULL
- `region_id` INTEGER REFERENCES regions(id)
- `district_id` INTEGER REFERENCES districts(id)
- `score` INTEGER NOT NULL CHECK(score >= 0 AND score <= 100)
- `created_at` TIMESTAMP DEFAULT NOW()
- `updated_at` TIMESTAMP DEFAULT NOW()

## Backend ishga tushirish

1. `cd backend`
2. `npm install`
3. `.env` faylini yarating va `backend/.env.example` bo‘yicha to‘ldiring
4. PostgreSQL ma'lumotlar bazasini yarating
5. `.env` faylida `DATABASE_URL` ni PostgreSQL login/parolingizga moslang
6. `psql -d your_database -f backend/db/init.sql` yoki boshqa migratsiya vositasi bilan ishga tushiring
7. `npm run dev`

## Frontend ishga tushirish

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Muhim endpointlar

- `POST /api/auth/login` - admin kirishi
- `GET /api/employees` - xodimlar ro‘yxati (public)
- `POST /api/employees` - xodim qo‘shish
- `PUT /api/employees/:id` - xodim tahrirlash
- `DELETE /api/employees/:id` - xodim o‘chirish
- `GET /api/regions` - viloyatlar
- `GET /api/districts` - tumanlar
- `GET /api/stats/top` - top 5 eng yaxshi / eng yomon xodim
- `GET /api/stats/regions` - viloyat statistikasi
- `GET /api/stats/districts` - tuman statistikasi
- `GET /api/stats/summary` - umumiy statistikalar

## Izohlar

- `superadmin` foydalanuvchi uchun `backend/db/init.sql` faylida dastlabki ma'lumot mavjud.
- Frontend va backend `localhost` da ishga tushadi. Agar portni o‘zgartirsangiz, `frontend/src/api.js` ichidagi `VITE_API_BASE` ni moslang.

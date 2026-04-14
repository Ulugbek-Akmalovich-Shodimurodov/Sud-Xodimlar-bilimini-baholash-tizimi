# Deploy Guide (GitHub + Free Hosting + Remote Management)

## 1) GitHub ga yuklash

Bu kompyuterda `git` topilmadi. Avval Git o'rnating:
- Windows: https://git-scm.com/download/win

So'ng terminalni qayta ochib, loyiha papkasida quyidagilarni bajaring:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

## 2) PostgreSQL (Supabase - Free)

1. Supabase'da yangi project yarating.
2. `backend/db/init.sql` faylini SQL Editor'da ishga tushiring.
3. `DATABASE_URL` ni oling.

`DATABASE_URL` ko'rinishi:
```bash
postgres://<user>:<password>@<host>:5432/<db>?sslmode=require
```

## 3) Backend deploy (Koyeb)

1. Koyeb'ga kiring va GitHub repo'ni ulang.
2. `backend` papkani service sifatida tanlang.
3. Build Command: `npm install`
4. Run Command: `npm start`
5. Environment Variables:
   - `DATABASE_URL=...` (Supabase/Neon URL)
   - `JWT_SECRET=...` (uzun random qiymat)
   - `JWT_EXPIRES_IN=1d`
   - `CORS_ORIGIN=https://<your-frontend-domain>`

Deploy bo'lgach backend URL ni saqlang, masalan:
`https://your-backend.koyeb.app`

## 4) Frontend deploy (Vercel)

1. Vercel'da repo'ni import qiling.
2. Root Directory: `frontend`
3. Environment Variables:
   - `VITE_API_BASE=https://your-backend.koyeb.app/api`
4. Deploy qiling.

## 5) Masofadan boshqarish

Asosiy usul: GitHub orqali.

1. Kodni o'zgartiring.
2. Push qiling:
   ```bash
   git add .
   git commit -m "Update"
   git push
   ```
3. Vercel va Koyeb avtomatik redeploy qiladi.

## 6) Tezkor tekshiruv checklist

- Frontend ochilyaptimi.
- Login ishlayaptimi.
- API `401/403` va role cheklovlari to'g'ri ishlayaptimi.
- Region/district/employee cheklovlari admin uchun to'g'ri ishlayaptimi.
- CORS xatosi yo'qmi.


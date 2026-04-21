# Ngrok Setup Guide - Variant A

## Qadam 1: Local Database Setup

```powershell
cd backend
npm install
npm run setup-db
```

## Qadam 2: Local Backend Test

```powershell
npm start
# Test: curl http://localhost:4000/
# Login test: curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
```

## Qadam 3: Ngrok ni o'rnatish va ishga tushirish

### Ngrok o'rnatish:
```powershell
choco install ngrok
```

### Ngrok ni PostgreSQL uchun ishga tushirish:
```powershell
ngrok tcp 5432
```

Ngrok ishga tushgandan so'ng, shunday ko'rinish chiqadi:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.1.0
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    tcp://4.tcp.ngrok.io:12345 -> localhost:5432

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Muhim:** `tcp://4.tcp.ngrok.io:12345` manzilini nusxalang.

## Qadam 4: Vercel Environment Variables

Vercel dashboardga boring:
1. https://vercel.com/dashboard
2. Backend projectingizni tanlang
3. Settings -> Environment Variables

Quyidagi variable larni qo'shing:

```
DATABASE_URL=postgresql://admin:admin@4.tcp.ngrok.io:12345/sud_xodimlar
DB_HOST=4.tcp.ngrok.io
DB_PORT=12345
DB_NAME=sud_xodimlar
DB_USER=admin
DB_PASSWORD=admin
JWT_SECRET=your_strong_jwt_secret_key_here
```

**Eslatma:** `4.tcp.ngrok.io:12345` ni ngrok dan olingan URL bilan almashtiring.

## Qadam 5: Backend ni qayta deploy qilish

```powershell
git add .
git commit -m "Configure for ngrok local database"
git push origin main
```

## Qadam 6: Test qilish

Backend deploy bo'lgandan so'ng (2-3 daqiqa):

```powershell
# Backend test
curl https://sud-bilimini-baholash-backend.vercel.app/

# Login test
curl -X POST https://sud-bilimini-baholash-backend.vercel.app/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
```

## Qadam 7: Frontend test

Frontendni oching:
1. https://sud-xodimlar-bilimini-baholash-tizi.vercel.app
2. Login qiling: username=superadmin, password=admin123
3. Xodim yaratish - database ga saqlanishi kerak

## Muammolar va yechimlari

### Problem: "Connection refused"
**Yechim:** 
- PostgreSQL ishlayotganiga ishonch hosil qiling
- Windows Services da PostgreSQL service ni tekshiring
- Port 5432 band emasligiga ishonch hosil qiling

### Problem: "Authentication failed"
**Yechim:**
- PostgreSQL login: admin, password: admin
- pgAdmin dan user permissions tekshiring

### Problem: Ngrok timeout
**Yechim:**
- Ngrok ni qayta ishga tushiring
- Boshqa port sinab ko'ring (5433)

### Problem: Vercel backend database ga ulana olmayapti
**Yechim:**
- Ngrok URL to'g'ri ekanligini tekshiring
- Vercel environment variables ni tekshiring
- Vercel deployment logs ni ko'ring

## Security eslatmalar

- Ngrok faqat test uchun ishlatiladi
- Production uchun cloud database (Supabase/Neon) tavsiya etiladi
- PostgreSQL password ni o'zgartiring
- Ngrok session ni yopib qo'ying ish tugagandan so'ng

## Qanday ishlashini tekshirish

1. **Local database da ma'lumot borligini tekshiring:**
```sql
psql -U admin -d sud_xodimlar -c "SELECT * FROM employees;"
```

2. **Vercel backend local database ga ulanayotganini tekshiring:**
- Vercel logs da "Database routes loaded successfully" ko'rinishi kerak
- Xodim yaratgandan so'ng local database da ko'rish kerak

3. **Data persistence test:**
- Xodim yaratish
- Ngrok ni o'chirib yanchish
- Qayta ngrok ishga tushirish
- Xodimlar yo'qolmaganligini tekshirish

Muvaffaqiyat! Endi sizning tizimingiz Vercel da ishlaydi, ma'lumotlar esa sizning kompyuteringizda saqlanadi.

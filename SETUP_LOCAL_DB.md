# Local PostgreSQL Database Setup Guide

## 1. PostgreSQL Installation (Windows)

### Option A: Download from official site
1. Go to https://www.postgresql.org/download/windows/
2. Download and install PostgreSQL 15 or 16
3. During installation, set password: `admin123`
4. Note the port (usually 5432)

### Option B: Using Chocolatey
```powershell
# Install Chocolatey if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql --params '/Password:admin123'
```

## 2. Database Setup

### Create Database
```sql
-- Open pgAdmin or psql and run:
CREATE DATABASE sud_xodimlar;
CREATE USER sud_user WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE sud_xodimlar TO sud_user;
```

### Or using psql command line:
```powershell
psql -U postgres -c "CREATE DATABASE sud_xodimlar;"
psql -U postgres -c "CREATE USER sud_user WITH PASSWORD 'admin123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sud_xodimlar TO sud_user;"
```

## 3. Backend Configuration

### Update .env file
Create or update `backend/.env`:
```
DATABASE_URL=postgresql://sud_user:admin123@localhost:5432/sud_xodimlar
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sud_xodimlar
DB_USER=sud_user
DB_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_key_here
```

### Test Database Connection
```powershell
cd backend
npm run test-db
```

## 4. Database Initialization

### Run initialization
```powershell
cd backend
npm run init-db
```

Or manually:
```powershell
node -e "import('./src/initDb.js').then(m => m.initializeDatabase())"
```

## 5. Vercel Deployment with Local Database

### Important Note
Vercel serverless functions CANNOT connect to your local database directly.
You have these options:

### Option A: Use ngrok (Recommended for development)
1. Install ngrok: `choco install ngrok`
2. Expose PostgreSQL: `ngrok tcp 5432`
3. Update DATABASE_URL with ngrok URL

### Option B: Use cloud database (Recommended for production)
- Supabase (free tier)
- Neon (free tier)
- Railway
- Heroku Postgres

### Option C: Self-hosted backend
- Run backend on your local machine
- Use Vercel only for frontend
- Configure CORS to allow localhost

## 6. Testing

### Test local database
```powershell
cd backend
npm start
```

### Test API endpoints
```powershell
# Test health
curl http://localhost:3000/

# Test login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
```

## 7. Troubleshooting

### Common Issues
1. **Connection refused**: PostgreSQL not running
2. **Authentication failed**: Wrong password/user
3. **Database doesn't exist**: Create database first
4. **Port already in use**: Change PostgreSQL port

### Reset Database
```sql
DROP DATABASE sud_xodimlar;
CREATE DATABASE sud_xodimlar;
GRANT ALL PRIVILEGES ON DATABASE sud_xodimlar TO sud_user;
```

## 8. Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL for database connections
- Regular backups

# Deployment Guide: Local Database + Vercel Frontend/Backend

## Architecture Overview

```
Frontend (Vercel)  -->  Backend (Vercel)  -->  Local Database (Your Computer)
```

## Option A: Using ngrok (Development/Testing)

### 1. Install ngrok
```powershell
choco install ngrok
```

### 2. Expose PostgreSQL to internet
```powershell
ngrok tcp 5432
```

### 3. Update Vercel Environment Variables
Go to Vercel dashboard -> your backend project -> Settings -> Environment Variables:

```
DATABASE_URL=postgresql://sud_user:admin123://4.tcp.ngrok.io:12345/sud_xodimlar
DB_HOST=4.tcp.ngrok.io
DB_PORT=12345
DB_NAME=sud_xodimlar
DB_USER=sud_user
DB_PASSWORD=admin123
JWT_SECRET=your_strong_secret_here
```

### 4. Redeploy Vercel backend
```powershell
git push origin main
```

## Option B: Cloud Database (Recommended for Production)

### 1. Set up Supabase (Free)
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings > Database

### 2. Update Vercel Environment Variables
```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
DB_HOST=db.[project].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[password]
JWT_SECRET=your_strong_secret_here
```

### 3. Initialize database
```powershell
curl -X POST https://your-backend.vercel.app/api/init-db
```

## Option C: Self-hosted Backend (Advanced)

### 1. Run backend locally
```powershell
cd backend
npm install
npm run setup-db
npm start
```

### 2. Update frontend API URL
In `frontend/src/api.js`, change:
```javascript
const API_BASE_URL = 'http://localhost:4000';
```

### 3. Deploy only frontend to Vercel
```powershell
cd frontend
vercel --prod
```

## Step-by-Step Setup (Option A with ngrok)

### 1. Set up local database
```powershell
cd backend
npm install
npm run setup-db
```

### 2. Test local backend
```powershell
npm start
# Test: curl http://localhost:4000/
```

### 3. Start ngrok for PostgreSQL
```powershell
ngrok tcp 5432
# Copy the ngrok URL (e.g., 4.tcp.ngrok.io:12345)
```

### 4. Update Vercel environment
1. Go to Vercel dashboard
2. Select your backend project
3. Settings > Environment Variables
4. Add the variables with ngrok URL

### 5. Deploy backend
```powershell
git add .
git commit -m "Configure for local database via ngrok"
git push origin main
```

### 6. Test deployment
```powershell
curl https://your-backend.vercel.app/
curl -X POST https://your-backend.vercel.app/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
```

## Security Considerations

### ngrok Security
- Use ngrok with authentication: `ngrok tcp 5432 -authtoken your_token`
- Change PostgreSQL password from default
- Use firewall to restrict access

### Cloud Database Security
- Enable SSL connections
- Use strong passwords
- Regular backups
- Monitor access logs

## Troubleshooting

### Common Issues
1. **ngrok connection timeout**: Restart ngrok
2. **Database connection refused**: Check PostgreSQL is running
3. **CORS errors**: Update CORS origins in backend
4. **Environment variables not loading**: Check Vercel deployment logs

### Reset Everything
```powershell
# Reset local database
psql -U postgres -c "DROP DATABASE sud_xodimlar;"
psql -U postgres -c "CREATE DATABASE sud_xodimlar;"

# Re-initialize
npm run init-db
```

### Check Vercel Logs
```bash
vercel logs your-backend-project
```

## Performance Tips

### Database Optimization
- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching

### Backend Optimization
- Use Redis for caching
- Implement rate limiting
- Compress responses

## Monitoring

### Database Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Backend Monitoring
- Use Vercel Analytics
- Set up error tracking (Sentry)
- Monitor API response times

## Backup Strategy

### Local Database Backup
```powershell
# Backup
pg_dump -U sud_user sud_xodimlar > backup.sql

# Restore
psql -U sud_user sud_xodimlar < backup.sql
```

### Automated Backup
```powershell
# Create backup script
echo "pg_dump -U sud_user sud_xodimlar > backup_$(date +%Y%m%d_%H%M%S).sql" > backup.bat
# Schedule with Windows Task Manager
```

## Next Steps

1. **Choose your deployment option** (A, B, or C)
2. **Set up local database** with `npm run setup-db`
3. **Configure environment variables** on Vercel
4. **Test the integration** thoroughly
5. **Monitor performance** and optimize as needed
6. **Set up backups** for data safety

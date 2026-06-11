$env:PGPASSWORD = 'admin'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
Write-Host "PSQL path: $psql"
Write-Host "PSQL exists: $(Test-Path $psql)"
Write-Host "PostgreSQL service:"
Get-Service -Name '*postgres*' -ErrorAction SilentlyContinue | Format-Table Name,DisplayName,Status -AutoSize
Write-Host "Listening on port 5432:"
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue | Format-Table LocalAddress,LocalPort,State,OwningProcess -AutoSize
Write-Host "Testing version query..."
& $psql -U postgres -h localhost -p 5432 -d postgres -c 'SELECT version();'
Write-Host "Creating database supreme_court..."
& $psql -U postgres -h localhost -p 5432 -d postgres -c 'CREATE DATABASE supreme_court;'
Write-Host "Testing database connection..."
& $psql -U postgres -h localhost -p 5432 -d supreme_court -c 'SELECT 1;'

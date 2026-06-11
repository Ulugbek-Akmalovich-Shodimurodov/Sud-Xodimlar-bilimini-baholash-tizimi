$env:PATH = 'C:\Program Files\PostgreSQL\18\bin;' + ';' + $env:PATH
$env:PGPASSWORD = 'admin'
Set-Location -Path 'C:\Users\Admin_07\Desktop\Sayt\backend'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -d postgres -c 'CREATE DATABASE supreme_court;'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -d supreme_court -c 'SELECT 1;'

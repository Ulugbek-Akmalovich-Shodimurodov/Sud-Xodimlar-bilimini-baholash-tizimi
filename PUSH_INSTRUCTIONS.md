# GitHub Push Instructions

Due to terminal output capture limitations in this environment, please execute the following commands manually in PowerShell or cmd:

```powershell
cd C:\Users\Admin_01\Desktop\Sayt

# 1. Check current status
git status

# 2. Stage all changes
git add -A

# 3. Commit the changes
git commit -m "Remove legacy static criteria and migrate to dynamic scores only

- Migrated from hardcoded static score columns (konstitutsiya_score, kodeks_score, etc.) to dynamic JSONB-based scores
- Updated backend/db/init.sql to define only dynamic criteria schema with explicit DROP COLUMN statements
- Updated backend scripts to use dynamic scores instead of legacy fields
- Updated backend validators and logging to work with dynamic criteria only
- Updated frontend EmployeeManager to remove hardcoded criteria and use admin-managed criteria"

# 4. Push to GitHub
git push
```

## What was changed:

1. **backend/db/init.sql** - Cleaned schema to use only `criteria` table + `employees.scores` JSONB
2. **backend/scripts/create-sample-data.js** - Updated sample data to use dynamic scores
3. **backend/scripts/manual-insert-defaults.js** - Updated default inserts to use dynamic scores
4. **backend/src/routes/employees.js** - Removed static score column handling
5. **backend/src/validators.js** - Removed static score validation entries
6. **backend/src/utils/logger.js** - Updated logging for dynamic scores
7. **frontend/src/components/EmployeeManager.jsx** - Removed hardcoded criteria list

## Status after cleanup:
- All legacy static criteria references have been removed
- `init.sql` has been restored to a clean valid state
- Repository ready for final push

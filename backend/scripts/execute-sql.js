import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSqlFile(sqlFilePath) {
  try {
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log('Executing SQL file:', sqlFilePath);
    console.log('SQL content:', sqlContent.substring(0, 100) + '...');
    
    const result = await query(sqlContent);
    console.log('SQL executed successfully:', result);
    return true;
  } catch (error) {
    console.error('SQL execution failed:', error.message);
    return false;
  }
}

// Execute the missing regions SQL file
if (import.meta.url === `file://${process.argv[1]}`) {
  executeSqlFile(path.join(__dirname, 'add-missing-regions.sql'))
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default executeSqlFile;

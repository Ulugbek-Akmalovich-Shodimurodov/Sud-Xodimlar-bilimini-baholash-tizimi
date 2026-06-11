import { query } from '../src/db.js';

async function insertDefaultData() {
  console.log('Default data insertion has been disabled.');
  return true;
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  insertDefaultData()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Manual insertion error:', error);
      process.exit(1);
    });
}

export default insertDefaultData;

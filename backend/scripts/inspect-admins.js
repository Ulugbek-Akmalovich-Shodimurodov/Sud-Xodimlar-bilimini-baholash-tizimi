import { query } from '../src/db.js';
(async()=>{
  try{
    const res = await query('SELECT id, username, role, password FROM admins');
    console.log(res.rows);
    process.exit(0);
  }catch(e){
    console.error(e.message);
    process.exit(1);
  }
})();

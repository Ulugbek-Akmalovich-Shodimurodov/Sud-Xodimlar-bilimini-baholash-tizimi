import bcrypt from 'bcrypt';
import { query } from '../src/db.js';
(async()=>{
  try{
    const res = await query('SELECT username, password FROM admins WHERE username=$1', ['superadmin']);
    console.log(res.rows[0]);
    const ok = await bcrypt.compare('admin123', res.rows[0].password);
    console.log('compare result:', ok);
    process.exit(0);
  }catch(e){
    console.error(e.message);
    process.exit(1);
  }
})();

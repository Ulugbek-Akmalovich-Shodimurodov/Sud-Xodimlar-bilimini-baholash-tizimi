import fetch from 'node-fetch';

const API = 'http://localhost:4000/api';

async function run(){
  try{
    // Login
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'apitest', password: 'apipass' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) { console.error('Login failed', loginJson); process.exit(1); }
    const token = loginJson.token;
    console.log('Token obtained');

    // Create 9 criteria
    const criteriaKeys = ['konstitutsiya','kodeks','protsessual_kodeks','akt_sohasi','odob_axloq','iuliyhiu','yulkuilk','ertfger','reyhrtg'];
    for(let i=0;i<criteriaKeys.length;i++){
      const key = criteriaKeys[i];
      const res = await fetch(`${API}/criteria`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ key, label: key, short_label: key.slice(0,4), sort_order: i })
      });
      const j = await res.json();
      console.log('Created criteria', j.id || j);
    }

    // Create employee with only konstitutsiya score 70
    // find a valid district
    const districtsRes = await fetch(`${API}/districts`);
    const districtsJson = await districtsRes.json();
    const districtId = (districtsJson && districtsJson[0] && districtsJson[0].id) || 1;

    const empRes = await fetch(`${API}/employees`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body: JSON.stringify({ full_name:'Test User', position:'Sudya', region_id:1, district_id:districtId, scores:{ konstitutsiya:70 } })
    });
    const empJson = await empRes.json();
    console.log('Employee create response:', empJson);

    // Fetch employee
    const listRes = await fetch(`${API}/employees`);
    const listJson = await listRes.json();
    console.log('Employees list sample:', listJson.data && listJson.data.slice(0,3));

    process.exit(0);
  }catch(e){
    console.error('Error', e);
    process.exit(1);
  }
}

run();

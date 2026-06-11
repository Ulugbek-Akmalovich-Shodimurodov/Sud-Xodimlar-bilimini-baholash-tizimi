import fetch from 'node-fetch';

async function run() {
  const loginResp = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'admin123' }),
  });
  const loginBody = await loginResp.json().catch(() => null);
  console.log('LOGIN', loginResp.status, loginBody);
  if (!loginBody?.token) {
    process.exit(1);
  }

  const payload = {
    full_name: 'Test User',
    position: 'Yuridik mutaxassis',
    region_id: 1,
    district_id: 1,
    chosen_sections: { konstitutsiya: ['section_1', 'section_2'] },
  };

  const res = await fetch('http://localhost:4000/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginBody.token}` },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('CREATE', res.status, text);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
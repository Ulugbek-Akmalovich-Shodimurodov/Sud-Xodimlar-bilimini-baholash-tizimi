import { execSync } from 'child_process';

async function createSampleData() {
  console.log('Creating sample data for testing...\n');

  try {
    // Check if backend is running
    console.log('1. Testing backend connection...');
    try {
      const response = await fetch('http://localhost:4000/');
      if (!response.ok) {
        console.log('   Backend not running. Please start with: npm start');
        return false;
      }
      console.log('   Backend is running');
    } catch (error) {
      console.log('   Backend not accessible. Please start with: npm start');
      return false;
    }

    // Create sample regions
    console.log('2. Creating sample regions...');
    const regions = [
      { name: 'Toshkent viloyati' },
      { name: 'Samarqand viloyati' },
      { name: 'Farg\'ona viloyati' },
      { name: 'Buxoro viloyati' },
      { name: 'Xorazm viloyati' },
      { name: 'Qashqadaryo viloyati' },
      { name: 'Jizzax viloyati' },
      { name: 'Navoiy viloyati' },
      { name: 'Andijon viloyati' },
      { name: 'Namangan viloyati' }
    ];

    for (const region of regions) {
      try {
        const response = await fetch('http://localhost:4000/api/regions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(region)
        });
        if (response.ok) {
          console.log(`   ✓ Created: ${region.name}`);
        }
      } catch (error) {
        console.log(`   ✗ Failed to create ${region.name}: ${error.message}`);
      }
    }

    // Create sample districts
    console.log('3. Creating sample districts...');
    const districts = [
      { name: 'Toshkent shahar', region_id: 1 },
      { name: 'Chirchiq', region_id: 1 },
      { name: 'Samarqand shahar', region_id: 2 },
      { name: 'Buxoro shahar', region_id: 4 },
      { name: 'Urganch', region_id: 5 },
      { name: 'Qarshi', region_id: 6 },
      { name: 'Kokand', region_id: 7 },
      { name: 'Navoiy shahar', region_id: 8 },
      { name: 'Andijon shahar', region_id: 9 },
      { name: 'Namangan shahar', region_id: 10 }
    ];

    for (const district of districts) {
      try {
        const response = await fetch('http://localhost:4000/api/districts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(district)
        });
        if (response.ok) {
          console.log(`   ✓ Created: ${district.name}`);
        }
      } catch (error) {
        console.log(`   ✗ Failed to create ${district.name}: ${error.message}`);
      }
    }

    // Create sample positions
    console.log('4. Creating sample positions...');
    const positions = [
      { name: 'Sud raisi' },
      { name: 'Sudya' },
      { name: 'Yuqori sud xodimi' },
      { name: 'Yuridik maslahatchi' },
      { name: 'Ma\'muriyat boshlig\'i' },
      { name: 'Prokuror' },
      { name: 'Kotib' },
      { name: 'Arxiv boshlig\'i' }
    ];

    for (const position of positions) {
      try {
        const response = await fetch('http://localhost:4000/api/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(position)
        });
        if (response.ok) {
          console.log(`   ✓ Created: ${position.name}`);
        }
      } catch (error) {
        console.log(`   ✗ Failed to create ${position.name}: ${error.message}`);
      }
    }

    // Create sample employees
    console.log('5. Creating sample employees...');
    const employees = [
      {
        full_name: 'Aliyev Valijon',
        position: 'Sudya',
        region_id: 1,
        district_id: 1,
        konstitutsiya_score: 85,
        kodeks_score: 78,
        protsessual_kodeks_score: 92,
        akt_sohasi_score: 88,
        odob_axloq_score: 90,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'Karimova Dilnoza',
        position: 'Yuqori sud xodimi',
        region_id: 2,
        district_id: 3,
        konstitutsiya_score: 92,
        kodeks_score: 85,
        protsessual_kodeks_score: 78,
        akt_sohasi_score: 95,
        odob_axloq_score: 88,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'To\'xtayev Bobur',
        position: 'Yuridik maslahatchi',
        region_id: 3,
        district_id: 5,
        konstitutsiya_score: 78,
        kodeks_score: 90,
        protsessual_kodeks_score: 85,
        akt_sohasi_score: 82,
        odob_axloq_score: 91,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'Sultonova Gulnora',
        position: 'Ma\'muriyat boshlig\'i',
        region_id: 4,
        district_id: 4,
        konstitutsiya_score: 88,
        kodeks_score: 82,
        protsessual_kodeks_score: 90,
        akt_sohasi_score: 85,
        odob_axloq_score: 87,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      }
    ];

    for (const employee of employees) {
      try {
        const response = await fetch('http://localhost:4000/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employee)
        });
        if (response.ok) {
          console.log(`   ✓ Created: ${employee.full_name}`);
        }
      } catch (error) {
        console.log(`   ✗ Failed to create ${employee.full_name}: ${error.message}`);
      }
    }

    console.log('\n✅ Sample data created successfully!');
    console.log('\nNow you can:');
    console.log('1. Check statistics: http://localhost:4000/api/stats/regions');
    console.log('2. Check districts: http://localhost:4000/api/stats/districts');
    console.log('3. Check employees: http://localhost:4000/api/employees');
    console.log('4. Open frontend: http://localhost:5173');

    return true;
  } catch (error) {
    console.error('Sample data creation failed:', error.message);
    return false;
  }
}

// Run sample data creation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Sample data creation error:', error);
      process.exit(1);
    });
}

export default createSampleData;

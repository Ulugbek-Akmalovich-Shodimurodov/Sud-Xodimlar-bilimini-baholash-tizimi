import { query } from '../src/db.js';

async function insertDefaultData() {
  console.log('Manually inserting default data...\n');

  try {
    // 1. Insert regions
    console.log('1. Inserting regions...');
    const regions = [
      'Toshkent viloyati',
      'Samarqand viloyati', 
      'Farg\'ona viloyati',
      'Buxoro viloyati',
      'Xorazm viloyati',
      'Qashqadaryo viloyati',
      'Jizzax viloyati',
      'Navoiy viloyati',
      'Andijon viloyati',
      'Namangan viloyati',
      'Sirdaryo viloyati'
    ];

    for (const regionName of regions) {
      try {
        await query('INSERT INTO regions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [regionName]);
        console.log(`   + ${regionName}`);
      } catch (error) {
        console.log(`   - Error inserting ${regionName}: ${error.message}`);
      }
    }

    // 2. Insert districts
    console.log('\n2. Inserting districts...');
    const districts = [
      ['Toshkent shahar', 'Toshkent viloyati'],
      ['Chirchiq', 'Toshkent viloyati'],
      ['Qibray', 'Toshkent viloyati'],
      ['Angren', 'Toshkent viloyati'],
      ['Bekobod', 'Toshkent viloyati'],
      ['Samarqand shahar', 'Samarqand viloyati'],
      ['Bulung\'ur', 'Samarqand viloyati'],
      ['Kattaqo\'rg\'on', 'Samarqand viloyati'],
      ['Urgut', 'Samarqand viloyati'],
      ['Farg\'ona shahar', 'Farg\'ona viloyati'],
      ['Kokand', 'Farg\'ona viloyati'],
      ['Quva', 'Farg\'ona viloyati'],
      ['Buxoro shahar', 'Buxoro viloyati'],
      ['Gijduvon', 'Buxoro viloyati'],
      ['Kogon', 'Buxoro viloyati'],
      ['Urganch', 'Xorazm viloyati'],
      ['Xiva', 'Xorazm viloyati'],
      ['Shovot', 'Xorazm viloyati'],
      ['Qarshi', 'Qashqadaryo viloyati'],
      ['Shahrisabz', 'Qashqadaryo viloyati'],
      ['Kitob', 'Qashqadaryo viloyati'],
      ['Jizzax shahar', 'Jizzax viloyati'],
      ['Zarafshon', 'Jizzax viloyati'],
      ['Gallaorol', 'Jizzax viloyati'],
      ['Navoiy shahar', 'Navoiy viloyati'],
      ['Qiziltepa', 'Navoiy viloyati'],
      ['Nurota', 'Navoiy viloyati'],
      ['Andijon shahar', 'Andijon viloyati'],
      ['Xonobod', 'Andijon viloyati'],
      ['Shahrixon', 'Andijon viloyati'],
      ['Namangan shahar', 'Namangan viloyati'],
      ['Chust', 'Namangan viloyati'],
      ['Pop', 'Namangan viloyati'],
      ['Guliston', 'Sirdaryo viloyati'],
      ['Boyovut', 'Sirdaryo viloyati'],
      ['Sirdaryo', 'Sirdaryo viloyati']
    ];

    for (const [districtName, regionName] of districts) {
      try {
        await query(`
          INSERT INTO districts (name, region_id) 
          VALUES ($1, (SELECT id FROM regions WHERE name = $2)) 
          ON CONFLICT DO NOTHING
        `, [districtName, regionName]);
        console.log(`   + ${districtName} (${regionName})`);
      } catch (error) {
        console.log(`   - Error inserting ${districtName}: ${error.message}`);
      }
    }

    // 3. Insert positions
    console.log('\n3. Inserting positions...');
    const positions = [
      'Sud raisi',
      'Sudya',
      'Yuqori sud xodimi',
      'Yuridik mutaxassis',
      'Ma\'muriyat xodimi',
      'Prokuror',
      'Kotib',
      'Arxiv boshlig\'i',
      'Yuridik maslahatchi',
      'Ishchi kengash a\'zosi',
      'Sud majlisining kotibyati',
      'Sud ijrochisi'
    ];

    for (const positionName of positions) {
      try {
        await query('INSERT INTO positions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [positionName]);
        console.log(`   + ${positionName}`);
      } catch (error) {
        console.log(`   - Error inserting ${positionName}: ${error.message}`);
      }
    }

    // 4. Insert employees
    console.log('\n4. Inserting employees...');
    const employees = [
      {
        full_name: 'Abdulla Axmedov',
        position: 'Yuqori sud xodimi',
        region_name: 'Toshkent viloyati',
        district_name: 'Toshkent shahar',
        score: 92,
        konstitutsiya_score: 95,
        kodeks_score: 90,
        protsessual_kodeks_score: 91,
        akt_sohasi_score: 88,
        odob_axloq_score: 92,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'Dilshod Mirzaev',
        position: 'Yuridik mutaxassis',
        region_name: 'Samarqand viloyati',
        district_name: 'Samarqand shahar',
        score: 78,
        konstitutsiya_score: 80,
        kodeks_score: 76,
        protsessual_kodeks_score: 79,
        akt_sohasi_score: 75,
        odob_axloq_score: 77,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirmadi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'Gulnora Karimova',
        position: 'Sud raisi',
        region_name: 'Farg\'ona viloyati',
        district_name: 'Farg\'ona shahar',
        score: 88,
        konstitutsiya_score: 90,
        kodeks_score: 85,
        protsessual_kodeks_score: 87,
        akt_sohasi_score: 89,
        odob_axloq_score: 86,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'Bobur Rahimov',
        position: 'Sudya',
        region_name: 'Buxoro viloyati',
        district_name: 'Buxoro shahar',
        score: 85,
        konstitutsiya_score: 88,
        kodeks_score: 82,
        protsessual_kodeks_score: 84,
        akt_sohasi_score: 86,
        odob_axloq_score: 83,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      },
      {
        full_name: 'Zarina Toshpulatova',
        position: 'Prokuror',
        region_name: 'Xorazm viloyati',
        district_name: 'Urganch',
        score: 91,
        konstitutsiya_score: 93,
        kodeks_score: 89,
        protsessual_kodeks_score: 90,
        akt_sohasi_score: 92,
        odob_axloq_score: 91,
        konstitutsiya_status: 'topshirdi',
        kodeks_status: 'topshirdi',
        protsessual_kodeks_status: 'topshirdi',
        akt_sohasi_status: 'topshirdi',
        odob_axloq_status: 'topshirdi'
      }
    ];

    for (const emp of employees) {
      try {
        await query(`
          INSERT INTO employees (
            full_name, position, region_id, district_id, score,
            konstitutsiya_score, kodeks_score, protsessual_kodeks_score, 
            akt_sohasi_score, odob_axloq_score,
            konstitutsiya_status, kodeks_status, protsessual_kodeks_status,
            akt_sohasi_status, odob_axloq_status
          ) VALUES (
            $1, $2, 
            (SELECT id FROM regions WHERE name = $3),
            (SELECT d.id FROM districts d JOIN regions r ON r.id = d.region_id 
             WHERE d.name = $4 AND r.name = $3),
            $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) ON CONFLICT DO NOTHING
        `, [
          emp.full_name, emp.position, emp.region_name, emp.district_name, emp.score,
          emp.konstitutsiya_score, emp.kodeks_score, emp.protsessual_kodeks_score,
          emp.akt_sohasi_score, emp.odob_axloq_score,
          emp.konstitutsiya_status, emp.kodeks_status, emp.protsessual_kodeks_status,
          emp.akt_sohasi_status, emp.odob_axloq_status
        ]);
        console.log(`   + ${emp.full_name} (${emp.position})`);
      } catch (error) {
        console.log(`   - Error inserting ${emp.full_name}: ${error.message}`);
      }
    }

    // 5. Verify data
    console.log('\n5. Verifying inserted data...');
    const regionsCount = await query('SELECT COUNT(*) as count FROM regions');
    const districtsCount = await query('SELECT COUNT(*) as count FROM districts');
    const positionsCount = await query('SELECT COUNT(*) as count FROM positions');
    const employeesCount = await query('SELECT COUNT(*) as count FROM employees');

    console.log(`\n   Regions: ${regionsCount.rows[0].count}`);
    console.log(`   Districts: ${districtsCount.rows[0].count}`);
    console.log(`   Positions: ${positionsCount.rows[0].count}`);
    console.log(`   Employees: ${employeesCount.rows[0].count}`);

    if (employeesCount.rows[0].count > 0) {
      console.log('\n   Sample employees:');
      const sampleEmployees = await query('SELECT full_name, position, score FROM employees LIMIT 3');
      sampleEmployees.rows.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.position}) - ${emp.score} ball`);
      });
    }

    console.log('\n   Default data insertion completed successfully!');
    return true;

  } catch (error) {
    console.error('Manual insertion failed:', error);
    return false;
  }
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

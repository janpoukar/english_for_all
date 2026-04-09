const https = require('https');

async function getAllUsers() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'english-website-i9p5.onrender.com',
      path: '/api/auth/admin/users',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-local-token-' + Date.now()
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 Hledám všechny studenty v databázi...\n');

    const result = await getAllUsers();

    if (result.status === 200 && Array.isArray(result.body)) {
      const students = result.body.filter(u => u.role === 'student');
      
      if (students.length === 0) {
        console.log('❌ Žádní studenti v databázi!\n');
        console.log('Zkusím vytvořit nového...\n');
      } else {
        console.log(`✅ Nalezeno ${students.length} studentů:\n`);
        console.log('═'.repeat(60));
        students.forEach((student, idx) => {
          console.log(`${idx + 1}. ${student.name}`);
          console.log(`   📧 Email: ${student.email}`);
          console.log(`   ID: ${student.id}\n`);
        });
        console.log('═'.repeat(60));
        
        const first = students[0];
        console.log(`\n🎯 PRVNÍ STUDENT:\n`);
        console.log(`📧 Email: ${first.email}`);
        console.log(`🔑 Heslo: (musíš si resetovat v admin panelu)`);
        console.log(`\n🔗 Jdi do Admin Panelu: https://english-website-i9p5.onrender.com/admin-panel`);
        console.log(`   a nastav mu nové heslo!\n`);
      }
    } else {
      console.log('❌ Chyba:', result.status, result.body);
    }

  } catch (err) {
    console.error('❌ Chyba:', err.message);
  }
}

main();

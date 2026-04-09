const https = require('https');

async function createStudent(name, email, password) {
  return new Promise((resolve, reject) => {
    const studentData = {
      name,
      email,
      password,
      role: 'student'
    };

    const postData = JSON.stringify(studentData);

    const options = {
      hostname: 'english-website-i9p5.onrender.com',
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Vytvářím testovacího studenta...\n');

    const result = await createStudent(
      'David Šimek',
      'student@demo.cz',
      'demo123'
    );

    if (result.status === 201) {
      console.log('✅ Student vytvořen!\n');
      console.log('═'.repeat(50));
      console.log('📧 Email:  student@demo.cz');
      console.log('🔑 Heslo:  demo123');
      console.log('═'.repeat(50));
      console.log('\n🔗 Login: https://english-website-i9p5.onrender.com/login\n');
    } else if (result.status === 400 && result.body?.error?.includes('existuje')) {
      console.log('✅ Student už existuje!\n');
      console.log('═'.repeat(50));
      console.log('📧 Email:  student@demo.cz');
      console.log('🔑 Heslo:  demo123');
      console.log('═'.repeat(50));
      console.log('\n🔗 Login: https://english-website-i9p5.onrender.com/login\n');
    } else {
      console.log(`❌ Chyba (${result.status}):`, result.body);
    }

  } catch (err) {
    console.error('❌ Chyba:', err.message);
  }
}

main();



require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const ADMIN_EMAIL = 'admin@smartbooking.com';
const ADMIN_NAME  = 'Admin';
const NEW_PASSWORD = process.argv[2] || 'admin123';

async function resetAdmin() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'smart_booking',
  });

  console.log('🔗 Connected to MySQL');

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  console.log(`🔐 Generated hash for "${NEW_PASSWORD}"`);

  // Upsert: update if exists, insert if not
  const [rows] = await db.execute(
    'SELECT id FROM users WHERE email = ?',
    [ADMIN_EMAIL]
  );

  if (rows.length > 0) {
    await db.execute(
      'UPDATE users SET password = ?, is_active = TRUE WHERE email = ?',
      [hash, ADMIN_EMAIL]
    );
    console.log(`✅ Admin password reset successfully.`);
  } else {
    await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin']
    );
    console.log(`✅ Admin user created successfully.`);
  }

  console.log(`\n📋 Admin credentials:`);
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
  console.log(`\n⚠️  Remember to change the password after first login!\n`);

  await db.end();
}

resetAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
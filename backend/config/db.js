const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mainline.proxy.rlwy.net',
  port: parseInt(process.env.DB_PORT) || 35948,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bDIKqoaUYepMtZeUqtodeJVoamQWEKkl',
  database: process.env.DB_NAME || 'railway',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL Connected');
  connection.release();
});

module.exports = db;
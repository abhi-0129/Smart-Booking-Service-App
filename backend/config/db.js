const mysql = require('mysql2');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  pool = mysql.createPool({
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    waitForConnections: true,
    connectionLimit: 10,
  });
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_booking',
    waitForConnections: true,
    connectionLimit: 10,
  });
}

const db = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
    return;
  }
  console.log('MySQL Connected');
  connection.release();
});

module.exports = db;
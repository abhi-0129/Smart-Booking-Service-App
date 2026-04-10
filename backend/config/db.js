const mysql = require('mysql2');
require('dotenv').config();

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_booking',
  };
}

const pool = mysql.createPool(poolConfig);

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
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool(
  process.env.DATABASE_URL
    ? process.env.DATABASE_URL          // Railway pe yeh use hoga
    : {                                  // Local pe yeh use hoga
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_booking',
      }
);

const db = pool.promise();

pool.getConnection((err, connection) => {
  if (err) { console.error('MySQL connection failed:', err.message); return; }
  console.log('MySQL Connected');
  connection.release();
});

module.exports = db;
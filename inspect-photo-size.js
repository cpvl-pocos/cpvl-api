const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function inspectPhotos() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    const [rows] = await connection.query(
      'SELECT id, firstName, lastName, LENGTH(photo_url) as photo_len FROM pilots'
    );
    console.log('--- Pilots Photo Sizes ---');
    let totalLen = 0;
    let countWithPhoto = 0;
    for (let row of rows) {
      if (row.photo_len) {
        console.log(`${row.firstName} ${row.lastName}: id=${row.id}, size=${(row.photo_len / 1024).toFixed(2)} KB`);
        totalLen += row.photo_len;
        countWithPhoto++;
      }
    }
    console.log(`\nTotal pilots: ${rows.length}`);
    console.log(`Pilots with photos: ${countWithPhoto}`);
    console.log(`Total photo data size: ${(totalLen / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Average photo size: ${countWithPhoto ? (totalLen / countWithPhoto / 1024).toFixed(2) : 0} KB`);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

inspectPhotos();

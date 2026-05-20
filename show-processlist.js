const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkProcesslist() {
  console.log('Connecting to:', process.env.DB_HOST);
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('Connected. Running SHOW PROCESSLIST...');
    const [rows] = await connection.query('SHOW PROCESSLIST');
    console.log('\n--- Active Database Processes ---');
    console.table(rows.map(r => ({
      Id: r.Id,
      User: r.User,
      Host: r.Host,
      db: r.db,
      Command: r.Command,
      Time: r.Time,
      State: r.State,
      Info: r.Info ? r.Info.substring(0, 100) : null
    })));

    console.log('\n--- Checking status variables ---');
    const [statusRows] = await connection.query("SHOW STATUS LIKE 'Threads_connected'");
    console.log(statusRows);

    await connection.end();
  } catch (error) {
    console.error('Error querying process list:', error);
  }
}

checkProcesslist();

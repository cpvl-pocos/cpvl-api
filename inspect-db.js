const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function inspect() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    // 1. List all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('--- Tables ---');
    console.log(tables);

    for (let tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\n--- Indexes for Table: ${tableName} ---`);
      const [indexes] = await connection.query(`SHOW INDEX FROM ${tableName}`);
      console.log(indexes.map(idx => ({
        Table: idx.Table,
        Non_unique: idx.Non_unique,
        Key_name: idx.Key_name,
        Seq_in_index: idx.Seq_in_index,
        Column_name: idx.Column_name,
        Collation: idx.Collation,
        Cardinality: idx.Cardinality
      })));
    }

    console.log('\n--- Checking rows count in key tables ---');
    for (let tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [[{ count }]] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`${tableName}: ${count} rows`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

inspect();

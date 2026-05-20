const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  }
);

async function run() {
  console.log('--- DB Latency Performance Diagnostics ---');
  console.log('DB Host:', process.env.DB_HOST);

  try {
    const startConnect = Date.now();
    await sequelize.authenticate();
    console.log(`Connection authenticated successfully in: ${Date.now() - startConnect}ms`);

    // Measure simple queries
    for (let i = 1; i <= 5; i++) {
      const startQuery = Date.now();
      await sequelize.query('SELECT 1 + 1 AS result');
      console.log(`[Query SELECT 1] Attempt ${i}: ${Date.now() - startQuery}ms`);
    }

    // Measure user find queries
    const userId = 1; // dummy user id
    for (let i = 1; i <= 5; i++) {
      const startQuery = Date.now();
      await sequelize.query(`SELECT * FROM users WHERE id = ${userId}`);
      console.log(`[Query SELECT user] Attempt ${i}: ${Date.now() - startQuery}ms`);
    }

    // Measure sequential vs parallel queries
    console.log('\nTesting sequential queries...');
    const startSeq = Date.now();
    await sequelize.query(`SELECT * FROM users WHERE id = ${userId}`);
    await sequelize.query(`SELECT * FROM pilots WHERE userId = ${userId}`);
    await sequelize.query(`SELECT * FROM paymentMonthlies WHERE userId = ${userId}`);
    console.log(`Sequential queries (3 queries) took: ${Date.now() - startSeq}ms`);

    console.log('\nTesting parallel queries...');
    const startPar = Date.now();
    await Promise.all([
      sequelize.query(`SELECT * FROM users WHERE id = ${userId}`),
      sequelize.query(`SELECT * FROM pilots WHERE userId = ${userId}`),
      sequelize.query(`SELECT * FROM paymentMonthlies WHERE userId = ${userId}`),
    ]);
    console.log(`Parallel queries (3 queries) took: ${Date.now() - startPar}ms`);

  } catch (error) {
    console.error('Error during performance check:', error);
  } finally {
    await sequelize.close();
  }
}

run();

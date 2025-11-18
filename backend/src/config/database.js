import pg from 'pg';
import dotenv from 'dotenv';
import MockDatabase from '../mocks/mockDatabase.js';

// Load environment variables before checking them
dotenv.config();

const { Pool } = pg;

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

let pool;

if (USE_MOCK_DB) {
  console.log('🎭 Using MOCK database - no real database connection required');
  pool = new MockDatabase();
} else {
  console.log('🗄️  Using REAL PostgreSQL database');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'charno_web',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

export default pool;

const { Pool } = require('pg');

const useSsl = (process.env.DB_SSL || 'true') !== 'false';
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    };

if (useSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Zvýšit timeout pro pomalá připojení (Supabase free tier)
poolConfig.connectionTimeoutMillis = 10000; // 10 sekund
poolConfig.idleTimeoutMillis = 30000; // 30 sekund idle timeout

const pool = new Pool(poolConfig);

// Better error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
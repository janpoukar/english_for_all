const { Pool } = require('pg');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const originalDnsLookup = dns.lookup.bind(dns);
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    return originalDnsLookup(hostname, { family: 4, all: false }, options);
  }

  if (options && typeof options === 'object') {
    return originalDnsLookup(hostname, { ...options, family: 4, all: false }, callback);
  }

  return originalDnsLookup(hostname, { family: 4, all: false }, callback);
};

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

// Supabase connection attempts can resolve to IPv6 on some hosts and fail with ENETUNREACH.
// Force IPv4 so the backend uses the working route consistently.
poolConfig.family = 4;

// Zvýšit timeout pro pomalá připojení (Supabase free tier)
poolConfig.connectionTimeoutMillis = 10000; // 10 sekund
poolConfig.idleTimeoutMillis = 30000; // 30 sekund idle timeout

const pool = new Pool(poolConfig);

// Better error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema on startup
const initializeSchema = async () => {
  try {
    console.log('Initializing database schema...');

    // Create materials table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
      );
    `);

    // Create index for faster lesson_id lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_materials_lesson_id 
      ON materials(lesson_id);
    `);

    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing database schema:', err.message);
  }
};

// Run schema initialization when module loads
initializeSchema().catch(err => console.error('Failed to initialize schema:', err));

module.exports = pool;
const { Pool } = require('pg');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const useSsl = (process.env.DB_SSL || 'true') !== 'false';
const pickFirstEnv = (keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim()) {
      return { key, value: String(value).trim() };
    }
  }

  return { key: null, value: null };
};

const connectionStringCandidate = pickFirstEnv([
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRESQL_URL',
  'SUPABASE_DATABASE_URL',
  'SUPABASE_DB_URL',
  'PG_CONNECTION_STRING',
  'PGDATABASE_URL',
]);
const connectionString = connectionStringCandidate.value;

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

const forceIPv4Lookup = (hostname, options, callback) => {
  const lookupOptions = { family: 4, all: false };

  if (typeof options === 'function') {
    return dns.lookup(hostname, lookupOptions, options);
  }

  return dns.lookup(hostname, { ...lookupOptions, ...(options || {}) }, callback);
};

poolConfig.lookup = forceIPv4Lookup;

// Supabase connection attempts can resolve to IPv6 on some hosts and fail with ENETUNREACH.
// Force IPv4 so the backend uses the working route consistently.
poolConfig.family = 4;

// Zvýšit timeout pro pomalá připojení (Supabase free tier)
poolConfig.connectionTimeoutMillis = 10000; // 10 sekund
poolConfig.idleTimeoutMillis = 30000; // 30 sekund idle timeout

const pool = new Pool(poolConfig);
console.log(`[PG] connection source: ${connectionStringCandidate.key || 'none'} | hasConnection: ${Boolean(connectionString)}`);

let lastPoolError = null;

const withIPv4Dns = async (operation) => {
  const originalLookup = dns.lookup;
  dns.lookup = (hostname, options, callback) => {
    if (typeof options === 'function') {
      return originalLookup(hostname, { family: 4, all: false }, options);
    }

    if (options && typeof options === 'object') {
      return originalLookup(hostname, { ...options, family: 4, all: false }, callback);
    }

    return originalLookup(hostname, { family: 4, all: false }, callback);
  };

  try {
    return await operation();
  } finally {
    dns.lookup = originalLookup;
  }
};

const pgQuery = (...args) => withIPv4Dns(() => pool.query(...args));
const pgConnect = (...args) => withIPv4Dns(() => pool.connect(...args));
const pgEnd = (...args) => pool.end(...args);

// Better error handling
pool.on('error', (err) => {
  lastPoolError = err ? {
    message: err.message || '',
    code: err.code || null,
    name: err.name || null,
  } : null;
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema on startup
const initializeSchema = async () => {
  try {
    console.log('Initializing database schema...');

    // Create materials table if it doesn't exist
    await pgQuery(`
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
    await pgQuery(`
      CREATE INDEX IF NOT EXISTS idx_materials_lesson_id 
      ON materials(lesson_id);
    `);

    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing database schema:', err.message);
  }
};

const getDatabaseDiagnostics = () => ({
  connectionSource: connectionStringCandidate.key,
  hasConnectionString: Boolean(connectionString),
  lastPoolError,
});

// Run schema initialization when module loads
initializeSchema().catch(err => console.error('Failed to initialize schema:', err));

module.exports = pool;
module.exports.query = pgQuery;
module.exports.connect = pgConnect;
module.exports.end = pgEnd;
module.exports.getDatabaseDiagnostics = getDatabaseDiagnostics;
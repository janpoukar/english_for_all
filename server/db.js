const { Pool } = require('pg');
const dns = require('dns');
const nativeDnsLookup = dns.lookup.bind(dns);

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
const normalizeConnectionString = (value) => {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    // Let node-postgres use explicit poolConfig.ssl instead of URL sslmode semantics.
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('uselibpqcompat');
    return parsed.toString();
  } catch {
    return value;
  }
};

const connectionString = normalizeConnectionString(connectionStringCandidate.value);

const parseConnectionStringMeta = (value) => {
  if (!value) {
    return { host: null, port: null };
  }

  try {
    const parsed = new URL(value);
    return {
      host: parsed.hostname || null,
      port: parsed.port || null,
    };
  } catch {
    return { host: null, port: null };
  }
};

const connectionMeta = parseConnectionStringMeta(connectionString);

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
  process.env.PGSSLMODE = process.env.PGSSLMODE || 'no-verify';
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const forceIPv4Lookup = (hostname, options, callback) => {
  const lookupOptions = { family: 4, all: false };

  if (typeof options === 'function') {
    return nativeDnsLookup(hostname, lookupOptions, options);
  }

  return nativeDnsLookup(hostname, { ...lookupOptions, ...(options || {}) }, callback);
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

const nativePoolQuery = pool.query.bind(pool);
const nativePoolConnect = pool.connect.bind(pool);
const nativePoolEnd = pool.end.bind(pool);

const pgQuery = (...args) => nativePoolQuery(...args);
const pgConnect = (...args) => nativePoolConnect(...args);
const pgEnd = (...args) => nativePoolEnd(...args);

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
  connectionHost: connectionMeta.host,
  connectionPort: connectionMeta.port,
  lastPoolError,
});

// Run schema initialization when module loads
initializeSchema().catch(err => console.error('Failed to initialize schema:', err));

module.exports = pool;
module.exports.query = pgQuery;
module.exports.connect = pgConnect;
module.exports.end = pgEnd;
module.exports.getDatabaseDiagnostics = getDatabaseDiagnostics;
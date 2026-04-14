const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.VITE_SUPABASE_URL;

const pickFirstEnv = (keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return null;
};

const SUPABASE_KEY = pickFirstEnv([
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_KEY',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
]);

const getSupabaseRoleFromJwt = (jwt) => {
  try {
    const parts = String(jwt || '').split('.');
    if (parts.length < 2) return 'unknown';
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload?.role || 'unknown';
  } catch {
    return 'unknown';
  }
};

const resolvedRole = getSupabaseRoleFromJwt(SUPABASE_KEY);
console.log(`[SUPABASE] URL configured: ${Boolean(SUPABASE_URL)} | key role: ${resolvedRole}`);

const getSupabaseDiagnostics = () => ({
  urlConfigured: Boolean(SUPABASE_URL),
  keyRole: resolvedRole,
});

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const supabaseFetch = async (endpoint, options = {}) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Chybí Supabase konfigurace na serveru (SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY)');
  }

  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
};

module.exports = { supabaseFetch, getSupabaseDiagnostics };
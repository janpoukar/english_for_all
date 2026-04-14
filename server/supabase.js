const normalizeSupabaseRestUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^postgres(?:ql)?:\/\//i.test(raw)) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    try {
      parsed = new URL(`https://${raw.replace(/^\/+/, '')}`);
    } catch {
      return null;
    }
  }

  const hostname = String(parsed.hostname || '').toLowerCase();
  if (!hostname) {
    return null;
  }

  if (hostname === 'supabase.co') {
    return null;
  }

  const isDbHost = /^db\.[^.]+\.supabase\.co$/.test(hostname);

  if (isDbHost) {
    const parts = hostname.split('.');
    const projectRef = parts[1];
    if (!projectRef) return null;
    return `https://${projectRef}.supabase.co`;
  }

  if (hostname.endsWith('.supabase.co')) {
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '');
  }

  return null;
};

const SUPABASE_URL_CANDIDATES = [
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
]
  .map((value) => String(value || '').trim())
  .filter(Boolean);

const SUPABASE_URL =
  SUPABASE_URL_CANDIDATES.map(normalizeSupabaseRestUrl).find(Boolean) || null;

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

const SUPABASE_ENV_PRESENT = {
  SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
  SUPABASE_PROJECT_URL: Boolean(process.env.SUPABASE_PROJECT_URL),
  VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  SUPABASE_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_KEY),
  SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
  SUPABASE_KEY: Boolean(process.env.SUPABASE_KEY),
  SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
  VITE_SUPABASE_ANON_KEY: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
};

const SUPABASE_URL_SOURCE = SUPABASE_URL_CANDIDATES.find((value) => normalizeSupabaseRestUrl(value)) || null;

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
console.log(
  `[SUPABASE] URL configured: ${Boolean(SUPABASE_URL)} | url source: ${SUPABASE_URL_SOURCE ? 'set' : 'missing'} | key role: ${resolvedRole} | env present: ${JSON.stringify(SUPABASE_ENV_PRESENT)}`
);

const getSupabaseDiagnostics = () => ({
  urlConfigured: Boolean(SUPABASE_URL),
  urlSourceConfigured: Boolean(SUPABASE_URL_SOURCE),
  keyRole: resolvedRole,
  keyLength: SUPABASE_KEY ? SUPABASE_KEY.length : 0,
  envPresent: SUPABASE_ENV_PRESENT,
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
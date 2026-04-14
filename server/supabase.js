const jwt = require('jsonwebtoken');

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

const expandSupabaseRestUrlCandidates = (value) => {
  const raw = String(value || '').trim();
  if (!raw || /^postgres(?:ql)?:\/\//i.test(raw)) {
    return [];
  }

  const candidates = [];

  const tryAdd = (candidate) => {
    const normalized = normalizeSupabaseRestUrl(candidate);
    if (normalized && !candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  tryAdd(raw);
  tryAdd(raw.replace(/^\/+/, ''));

  try {
    const parsed = new URL(raw.includes('://') ? raw : `https://${raw.replace(/^\/+/, '')}`);
    const hostname = String(parsed.hostname || '').toLowerCase();
    if (/^db\.[^.]+\.supabase\.co$/.test(hostname)) {
      const projectRef = hostname.split('.')[1];
      if (projectRef) {
        tryAdd(`https://${projectRef}.supabase.co`);
      }
    }
  } catch {
    // Ignore malformed candidates and fall back to the normalized list above.
  }

  return candidates;
};

const SUPABASE_URL_CANDIDATES = [
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
]
  .map((value) => String(value || '').trim())
  .filter(Boolean);

const SUPABASE_URL_OPTIONS = Array.from(
  new Set(SUPABASE_URL_CANDIDATES.flatMap((value) => expandSupabaseRestUrlCandidates(value)))
);

const SUPABASE_URL = SUPABASE_URL_OPTIONS[0] || null;

const SUPABASE_RESOLVED_HOST = (() => {
  if (!SUPABASE_URL) return null;
  try {
    return new URL(SUPABASE_URL).hostname;
  } catch {
    return null;
  }
})();

const SUPABASE_PROJECT_REF = SUPABASE_RESOLVED_HOST ? String(SUPABASE_RESOLVED_HOST).split('.')[0] : null;

const pickFirstEnv = (keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return null;
};

const SUPABASE_SERVICE_ROLE_KEY = pickFirstEnv([
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_KEY',
]);

const SUPABASE_ANON_KEY = pickFirstEnv([
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
]);

const SUPABASE_JWT_SECRET = pickFirstEnv([
  'JWT_SECRET',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_JWT_SECRET_KEY',
]);

const buildServiceRoleToken = () => {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return { token: SUPABASE_SERVICE_ROLE_KEY, source: 'service_role_key' };
  }

  if (!SUPABASE_JWT_SECRET) {
    return { token: null, source: 'missing' };
  }

  const token = jwt.sign(
    {
      role: 'service_role',
      iss: 'supabase',
      aud: 'authenticated',
      sub: 'service_role',
      ref: SUPABASE_PROJECT_REF,
    },
    SUPABASE_JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h',
    }
  );

  return { token, source: 'jwt_secret_signed_service_role' };
};

const SUPABASE_AUTH = buildServiceRoleToken();
const SUPABASE_API_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_AUTH.token || SUPABASE_ANON_KEY || null;
const SUPABASE_AUTH_TOKEN = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_AUTH.token || SUPABASE_API_KEY;

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
  JWT_SECRET: Boolean(process.env.JWT_SECRET),
  SUPABASE_JWT_SECRET: Boolean(process.env.SUPABASE_JWT_SECRET),
  SUPABASE_JWT_SECRET_KEY: Boolean(process.env.SUPABASE_JWT_SECRET_KEY),
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

const resolvedRole = getSupabaseRoleFromJwt(SUPABASE_API_KEY);
const resolvedAuthRole = getSupabaseRoleFromJwt(SUPABASE_AUTH_TOKEN);
console.log(
  `[SUPABASE] URL configured: ${Boolean(SUPABASE_URL)} | url source: ${SUPABASE_URL_SOURCE ? 'set' : 'missing'} | auth source: ${SUPABASE_AUTH.source} | api role: ${resolvedRole} | auth role: ${resolvedAuthRole} | env present: ${JSON.stringify(SUPABASE_ENV_PRESENT)}`
);

const getSupabaseDiagnostics = () => ({
  urlConfigured: Boolean(SUPABASE_URL),
  urlSourceConfigured: Boolean(SUPABASE_URL_SOURCE),
  resolvedHost: SUPABASE_RESOLVED_HOST,
  authSource: SUPABASE_AUTH.source,
  keyRole: resolvedRole,
  authRole: resolvedAuthRole,
  keyLength: SUPABASE_API_KEY ? SUPABASE_API_KEY.length : 0,
  authLength: SUPABASE_AUTH_TOKEN ? SUPABASE_AUTH_TOKEN.length : 0,
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
  if (SUPABASE_URL_OPTIONS.length === 0 || !SUPABASE_API_KEY || !SUPABASE_AUTH_TOKEN) {
    throw new Error('Chybí Supabase konfigurace na serveru (SUPABASE_URL a service nebo anon klíč / JWT secret)');
  }

  let lastError = null;
  const attemptedHosts = [];

  for (const baseUrl of SUPABASE_URL_OPTIONS) {
    const host = (() => {
      try {
        return new URL(baseUrl).hostname;
      } catch {
        return 'unknown';
      }
    })();
    attemptedHosts.push(host);
    const url = `${baseUrl}/rest/v1${endpoint}`;
    const headers = {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_AUTH_TOKEN}`,
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        const message = data?.message || data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }

      return data;
    } catch (err) {
      lastError = err;
      const message = String(err?.message || '').toLowerCase();
      const shouldTryNext = message.includes('fetch failed') || message.includes('invalid ip address') || message.includes('enotfound');
      if (!shouldTryNext) {
        throw err;
      }
    }
  }

  const cause = lastError?.cause;
  const causeDetails = cause
    ? ` cause=${cause.code || cause.name || 'unknown'}${cause.hostname ? ` host=${cause.hostname}` : ''}${cause.address ? ` address=${cause.address}` : ''}`
    : '';
  const endpointDetails = `endpoint=${endpoint} hosts=${attemptedHosts.join(',')}`;
  throw new Error(`${lastError?.message || 'Nepodařilo se spojit se Supabase'} (${endpointDetails}${causeDetails})`);
};

module.exports = { supabaseFetch, getSupabaseDiagnostics };
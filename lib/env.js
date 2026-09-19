/**
 * Centralised environment validation.
 *
 * Configuration problems previously surfaced as a runtime failure somewhere
 * deep in a request. This classifies every variable once so /api/health can
 * report what is wrong without ever echoing a value.
 *
 * Nothing here throws — the public site must keep serving even when the admin
 * or the database is misconfigured.
 */

const DRIVER = String(process.env.DATA_DRIVER || 'supabase').trim().toLowerCase();
const PROD = process.env.NODE_ENV === 'production';

const present = (v) => typeof v === 'string' && v.trim().length > 0;

export function inspectEnv() {
  const problems = [];
  const warnings = [];

  // --- Admin auth (optional: the public site runs without it) ---------------
  const hasPassword = present(process.env.ADMIN_PASSWORD);
  const hasSecret = present(process.env.SESSION_SECRET);
  const adminReady = hasPassword && hasSecret &&
    process.env.SESSION_SECRET.length >= 32 &&
    process.env.ADMIN_PASSWORD.length >= 12;

  if (!hasPassword || !hasSecret) {
    warnings.push('Admin sign-in is disabled: ADMIN_PASSWORD and SESSION_SECRET are not both set.');
  } else {
    if (process.env.SESSION_SECRET.length < 32) problems.push('SESSION_SECRET must be at least 32 characters.');
    if (PROD && process.env.ADMIN_PASSWORD.length < 12) problems.push('ADMIN_PASSWORD must be at least 12 characters in production.');
  }

  // --- Supabase -------------------------------------------------------------
  const serverUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const browserKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase is the default, so these are required unless the developer has
  // explicitly opted into the local file driver.
  if (DRIVER !== 'file') {
    if (!present(serverUrl)) problems.push('SUPABASE_URL is required when DATA_DRIVER=supabase.');
    if (!present(serverKey)) problems.push('SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required when DATA_DRIVER=supabase.');
    if (!present(browserKey)) warnings.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set — admin media uploads will not work.');
  }

  // --- Key-placement mistakes ----------------------------------------------
  // A secret key in a NEXT_PUBLIC_ variable is shipped to every browser.
  for (const name of ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    const v = process.env[name];
    if (present(v) && v.startsWith('sb_secret_')) {
      problems.push(name + ' contains a SECRET key. Rotate it immediately and move it server-side.');
    }
  }
  if (present(serverKey) && serverKey.startsWith('sb_publishable_')) {
    problems.push('The server key is a publishable key — database writes will be denied.');
  }

  // --- Site URL -------------------------------------------------------------
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (present(siteUrl)) {
    try {
      new URL(siteUrl);
    } catch {
      problems.push('NEXT_PUBLIC_SITE_URL is not a valid URL.');
    }
  } else if (PROD && !process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    warnings.push('NEXT_PUBLIC_SITE_URL is not set — canonical URLs and the sitemap will use a fallback origin.');
  }

  // --- Serverless filesystem -----------------------------------------------
  if (DRIVER === 'file' && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    problems.push('DATA_DRIVER=file cannot persist on a serverless host. Use supabase.');
  }

  return {
    driver: DRIVER,
    adminReady,
    supabaseConfigured: present(serverUrl) && present(serverKey),
    browserUploadsConfigured: present(browserKey),
    problems,
    warnings
  };
}

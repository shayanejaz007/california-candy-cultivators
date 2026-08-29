/**
 * Supabase environment resolution.
 *
 * Supabase has two generations of API key naming and both are in the wild:
 *
 *   legacy   anon (public)          service_role (secret)
 *   current  sb_publishable_...     sb_secret_...
 *
 * Dashboards hand out whichever the project was created with, so both are
 * accepted rather than forcing you to rename a variable to match this codebase.
 *
 * IMPORTANT: the browser key is inlined into the client bundle at build time,
 * so it must be referenced as a full literal `process.env.NEXT_PUBLIC_...`
 * expression somewhere Next can statically see. That is why the client-side
 * lookup below is written out longhand instead of being computed.
 */

/** Server-side URL. Falls back to the public one, which is the same value. */
export function serverUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

/**
 * Secret key — full database access, bypasses RLS. Server only.
 * Never expose this to the browser and never prefix it with NEXT_PUBLIC_.
 */
export function secretKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  );
}

/** Public URL, safe in the browser. */
export const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

/**
 * Public key, safe in the browser — it is restricted by row-level security.
 * Used only for direct-to-storage media uploads from the admin panel.
 */
export const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

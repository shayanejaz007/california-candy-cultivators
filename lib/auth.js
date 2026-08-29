import crypto from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin session handling.
 *
 * The session cookie carries `expiry.passwordFingerprint.hmac`. Binding the
 * password fingerprint into the signed payload means that rotating
 * ADMIN_PASSWORD immediately invalidates every live session — without it, a
 * stolen cookie stayed valid for its full lifetime even after you changed the
 * password in response to the theft.
 */

const PROD = process.env.NODE_ENV === 'production';

// The __Host- prefix tells the browser to refuse the cookie unless it is
// Secure, path=/ and has no Domain attribute. It cannot be set over plain HTTP,
// so development falls back to the unprefixed name.
const COOKIE = PROD ? '__Host-ccc_admin' : 'ccc_admin';
const MAX_AGE = 60 * 60 * 12; // 12 hours

const WEAK = new Set(['change-me', 'password', 'admin', 'changeme', 'test']);

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('CONFIG: SESSION_SECRET is missing or shorter than 32 characters.');
  }
  return s;
}

function adminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error('CONFIG: ADMIN_PASSWORD is not set.');
  if (PROD && (p.length < 12 || WEAK.has(p.toLowerCase()))) {
    throw new Error('CONFIG: ADMIN_PASSWORD is too weak for production.');
  }
  return p;
}

/** Short, non-reversible fingerprint of the current password. */
function fingerprint() {
  return crypto
    .createHmac('sha256', secret())
    .update('pw:' + adminPassword())
    .digest('hex')
    .slice(0, 16);
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

/**
 * Constant-time compare.
 *
 * Both sides are hashed to a fixed width first. timingSafeEqual throws on
 * length mismatch, and returning early on differing lengths would leak the
 * length of the expected value through response timing.
 */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Throws a CONFIG error if the environment is not fit to serve admin traffic. */
export function assertAuthConfig() {
  secret();
  adminPassword();
}

export function checkPassword(input) {
  return safeEqual(input ?? '', adminPassword());
}

export async function issueSession() {
  const payload = String(Date.now() + MAX_AGE * 1000) + '.' + fingerprint();
  const jar = await cookies();
  jar.set(COOKIE, payload + '.' + sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: PROD,
    path: '/',
    maxAge: MAX_AGE
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: PROD,
    path: '/',
    maxAge: 0
  });
}

export async function isAuthed() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;

  const parts = raw.split('.');
  if (parts.length !== 3) return false;

  const [expiry, fp, mac] = parts;
  const payload = expiry + '.' + fp;

  try {
    if (!safeEqual(mac, sign(payload))) return false;
    // Password rotated since this session was issued.
    if (!safeEqual(fp, fingerprint())) return false;
  } catch {
    // Misconfigured environment: fail closed rather than open.
    return false;
  }

  const exp = Number(expiry);
  return Number.isFinite(exp) && exp > Date.now();
}

/** Guard for route handlers. Returns a Response when unauthorised, else null. */
export async function requireAdmin() {
  if (await isAuthed()) return null;
  return Response.json({ error: 'Unauthorised' }, { status: 401 });
}

import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export { hashPassword, verifyPassword, checkPasswordStrength } from './password.js';

/**
 * Customer account authentication.
 *
 * Deliberately separate from lib/auth.js: that guards the admin panel with a
 * single shared password, while this handles many individual accounts, each
 * with its own approval state. Mixing them would mean one cookie could be
 * mistaken for the other.
 *
 * Passwords are hashed with scrypt — memory-hard, so a leaked table cannot be
 * cracked with GPUs the way an SHA-family digest can. Verification is
 * constant-time.
 *
 * NOTE: this is a hand-rolled session, not Supabase Auth. It reuses the signing
 * approach already proven in lib/auth.js and works with the same data drivers,
 * which meant it could be tested end to end before shipping. If you later want
 * password resets, email verification or social login, migrate to Supabase Auth
 * — that is the point at which rolling your own stops being worth it.
 */

const PROD = process.env.NODE_ENV === 'production';
const COOKIE = PROD ? '__Host-ccc_account' : 'ccc_account';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days — customers should not be re-asked often

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('CONFIG: SESSION_SECRET is missing or shorter than 32 characters.');
  }
  return s;
}

/* -------------------------------------------------------------- sessions --- */

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function issueCustomerSession(customerId) {
  const payload = String(Date.now() + MAX_AGE * 1000) + '.' + customerId;
  const jar = await cookies();
  jar.set(COOKIE, payload + '.' + sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: PROD,
    path: '/',
    maxAge: MAX_AGE
  });
}

export async function clearCustomerSession() {
  const jar = await cookies();
  jar.set(COOKIE, '', {
    httpOnly: true, sameSite: 'lax', secure: PROD, path: '/', maxAge: 0
  });
}

/**
 * The signed customer id, or null.
 *
 * This proves only that the cookie is authentic — it says nothing about
 * approval state, which can be revoked at any time by an admin. Always follow
 * it with a fresh lookup; never treat the cookie itself as authorisation.
 */
export async function customerIdFromCookie() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split('.');
  if (parts.length !== 3) return null;

  const [expiry, id, mac] = parts;
  try {
    if (!safeEqual(mac, sign(expiry + '.' + id))) return null;
  } catch {
    return null;
  }

  const exp = Number(expiry);
  if (!Number.isFinite(exp) || exp <= Date.now()) return null;
  return id;
}

export const ACCOUNT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

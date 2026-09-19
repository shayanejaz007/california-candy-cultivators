import crypto from 'node:crypto';

/**
 * Password hashing.
 *
 * Kept free of any Next import so it can be unit-tested in plain Node and so
 * nothing that pulls it in accidentally drags `next/headers` along.
 *
 * scrypt is memory-hard: a leaked table cannot be attacked with GPUs the way
 * an SHA-family digest can. Comparison is constant-time.
 */

const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;

/** @returns {string} `scrypt$<salt-hex>$<hash-hex>` */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, KEYLEN, SCRYPT);
  return 'scrypt$' + salt.toString('hex') + '$' + hash.toString('hex');
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored || '').split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

    const expected = Buffer.from(hashHex, 'hex');
    if (expected.length !== KEYLEN) return false;

    const actual = crypto.scryptSync(
      String(password), Buffer.from(saltHex, 'hex'), KEYLEN, SCRYPT
    );
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** @returns {{ ok: true } | { ok: false, error: string }} */
export function checkPasswordStrength(password) {
  const p = String(password || '');
  if (p.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };
  if (p.length > 200) return { ok: false, error: 'Password is too long' };
  return { ok: true };
}

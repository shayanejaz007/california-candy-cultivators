import { createCustomer } from '@/lib/db';
import { hashPassword, checkPasswordStrength } from '@/lib/password';
import { clientKey, hit, tooMany } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const WINDOW = 60 * 60 * 1000;
const PER_CLIENT = 5;
const GLOBAL = 200;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const key = clientKey(request);
  const perClient = hit('signup:' + key, PER_CLIENT, WINDOW);
  const global = hit('signup:*', GLOBAL, WINDOW);
  if (!perClient.ok || !global.ok) {
    return tooMany(
      'Too many sign-up attempts. Try again later.',
      Math.max(perClient.retryAfter, global.retryAfter)
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Honeypot, as on the inquiry form.
  if (String(body?.website || '').trim()) {
    return Response.json({ ok: true, status: 'PENDING' }, { status: 201 });
  }

  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim();
  const phone = String(body?.phone || '').trim();
  const password = String(body?.password || '');

  if (!name) return Response.json({ error: 'Your name is required' }, { status: 422 });
  if (!EMAIL.test(email)) return Response.json({ error: 'A valid email is required' }, { status: 422 });
  if (phone.replace(/[^0-9]/g, '').length < 7) {
    return Response.json({ error: 'A valid phone number is required' }, { status: 422 });
  }

  const strength = checkPasswordStrength(password);
  if (!strength.ok) return Response.json({ error: strength.error }, { status: 422 });

  let result;
  try {
    result = await createCustomer({
      name, email, phone,
      company: String(body?.company || '').trim(),
      passwordHash: hashPassword(password)
    });
  } catch (err) {
    console.error('[signup] failed:', err?.message || err);
    return Response.json({ error: 'Could not create that account' }, { status: 500 });
  }

  // An already-registered address gets the same response as a new one.
  // Saying "that email is taken" would turn this endpoint into a way to
  // enumerate who holds an account here — which, for this business, is
  // information worth protecting.
  return Response.json({ ok: true, status: 'PENDING' }, { status: 201 });
}

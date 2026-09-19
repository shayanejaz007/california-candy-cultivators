import { getCustomerForAuth } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { issueCustomerSession } from '@/lib/customer-auth';
import { clientKey, hit, reset, tooMany } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const WINDOW = 15 * 60 * 1000;
const PER_CLIENT = 10;
const GLOBAL = 300;

export async function POST(request) {
  const key = clientKey(request);
  const perClient = hit('signin:' + key, PER_CLIENT, WINDOW);
  const global = hit('signin:*', GLOBAL, WINDOW);
  if (!perClient.ok || !global.ok) {
    return tooMany(
      'Too many sign-in attempts. Try again later.',
      Math.max(perClient.retryAfter, global.retryAfter)
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = String(body?.email || '').trim();
  const password = String(body?.password || '');

  let customer = null;
  try {
    customer = await getCustomerForAuth(email);
  } catch (err) {
    console.error('[signin] lookup failed:', err?.message || err);
    return Response.json({ error: 'Sign-in is unavailable' }, { status: 503 });
  }

  const valid = customer && verifyPassword(password, customer.passwordHash);

  if (!valid) {
    // Same delay and message whether the address exists or the password is
    // wrong, so neither can be probed for.
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ error: 'Incorrect email or password' }, { status: 401 });
  }

  if (customer.status === 'REJECTED' || customer.status === 'SUSPENDED') {
    return Response.json(
      { error: 'This account is not active. Contact us if you think that is a mistake.' },
      { status: 403 }
    );
  }

  reset('signin:' + key);
  await issueCustomerSession(customer.id);

  // A pending account signs in successfully — it just cannot see the menu yet.
  return Response.json({ ok: true, status: customer.status });
}

import { assertAuthConfig, checkPassword, clearSession, issueSession } from '@/lib/auth';
import { clientKey, hit, reset, tooMany } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const WINDOW = 15 * 60 * 1000;
const PER_CLIENT = 10;
// A global ceiling so that forging X-Forwarded-For to rotate buckets does not
// hand an attacker an unlimited attempt budget.
const GLOBAL = 100;

export async function POST(request) {
  const key = clientKey(request);

  const perClient = hit('login:' + key, PER_CLIENT, WINDOW);
  const global = hit('login:*', GLOBAL, WINDOW);
  if (!perClient.ok || !global.ok) {
    return tooMany(
      'Too many sign-in attempts. Try again later.',
      Math.max(perClient.retryAfter, global.retryAfter)
    );
  }

  try {
    assertAuthConfig();
  } catch (err) {
    // Log the detail for the operator; tell the client nothing about the
    // server's configuration.
    console.error('[auth] ' + err.message);
    return Response.json({ error: 'Sign-in is unavailable.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const password = typeof body?.password === 'string' ? body.password : '';

  if (!checkPassword(password)) {
    // Blunt the timing signal on a wrong password.
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ error: 'Incorrect password' }, { status: 401 });
  }

  reset('login:' + key);
  await issueSession();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await clearSession();
  return Response.json({ ok: true });
}

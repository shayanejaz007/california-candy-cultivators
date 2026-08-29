import { allInquiries, createInquiry } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { clientKey, hit, tooMany } from '@/lib/rate-limit';
import { notifyInquiry } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const WINDOW = 10 * 60 * 1000;
const PER_CLIENT = 5;
const GLOBAL = 200;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await allInquiries());
}

export async function POST(request) {
  const key = clientKey(request);
  const perClient = hit('inquiry:' + key, PER_CLIENT, WINDOW);
  const global = hit('inquiry:*', GLOBAL, WINDOW);
  if (!perClient.ok || !global.ok) {
    return tooMany(
      'Too many inquiries from this connection. Try again later.',
      Math.max(perClient.retryAfter, global.retryAfter)
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Honeypot: a hidden field real people never fill in. Accept and discard, so
  // the bot sees success and does not retry with a different shape.
  if (String(body?.company || '').trim()) {
    return Response.json({ id: 'ok' }, { status: 201 });
  }

  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();

  if (!name || !phone) {
    return Response.json(
      { error: 'Name and phone number are required' },
      { status: 422 }
    );
  }
  // Enough digits to be a real number, but permissive about formatting,
  // country codes and extensions.
  if (phone.replace(/[^0-9]/g, '').length < 7) {
    return Response.json({ error: 'That phone number looks incomplete' }, { status: 422 });
  }

  let inquiry;
  try {
    inquiry = await createInquiry({ ...body, name, phone });
  } catch (err) {
    console.error('[inquiries] create failed:', err);
    return Response.json({ error: 'Could not save that inquiry' }, { status: 500 });
  }

  // Fire-and-forget: a webhook outage must not fail the visitor's submission.
  notifyInquiry(inquiry).catch((err) => console.error('[inquiries] notify failed:', err));

  return Response.json({ id: inquiry.id }, { status: 201 });
}

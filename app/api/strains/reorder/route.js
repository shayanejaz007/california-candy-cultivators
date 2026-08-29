import { reorderStrains } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(body?.slugs)) {
    return Response.json({ error: 'slugs[] is required' }, { status: 422 });
  }
  await reorderStrains(body.slugs.map(String));
  return Response.json({ ok: true });
}

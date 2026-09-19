import { deleteStrain, updateStrain } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const { slug } = await params;
  const denied = await requireAdmin();
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const strain = await updateStrain(slug, body);
  if (!strain) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(strain);
}

export async function DELETE(_request, { params }) {
  const { slug } = await params;
  const denied = await requireAdmin();
  if (denied) return denied;
  const ok = await deleteStrain(slug);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return new Response(null, { status: 204 });
}

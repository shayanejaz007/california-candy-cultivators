import { requireAdmin } from '@/lib/auth';
import { deleteCustomer, updateCustomer } from '@/lib/db';
import { ACCOUNT_STATUSES } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (body.status !== undefined && !ACCOUNT_STATUSES.includes(body.status)) {
    return Response.json(
      { error: 'Status must be one of: ' + ACCOUNT_STATUSES.join(', ') },
      { status: 422 }
    );
  }

  const updated = await updateCustomer(id, body);
  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });


  return Response.json(updated);
}

export async function DELETE(_request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteCustomer(id);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });

  return new Response(null, { status: 204 });
}

import { allStrains, createStrain } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await allStrains());
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body?.name || !String(body.name).trim()) {
    return Response.json({ error: 'A strain name is required' }, { status: 422 });
  }
  const strain = await createStrain(body);
  return Response.json(strain, { status: 201 });
}

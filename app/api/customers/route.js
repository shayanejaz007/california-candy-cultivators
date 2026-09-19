import { requireAdmin } from '@/lib/auth';
import { allCustomers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await allCustomers());
}

import { clearCustomerSession } from '@/lib/customer-auth';
import { currentCustomer } from '@/lib/account';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { customer, approved } = await currentCustomer();
  if (!customer) return Response.json({ signedIn: false });
  return Response.json({
    signedIn: true,
    approved,
    status: customer.status,
    name: customer.name,
    email: customer.email
  });
}

export async function DELETE() {
  await clearCustomerSession();
  return Response.json({ ok: true });
}

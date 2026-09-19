import { redirect } from 'next/navigation';
import AccountShell from '../components/AccountShell';
import AccountForm from '../components/AccountForm';
import { currentCustomer } from '@/lib/account';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Request access',
  description: 'Request an account to view the current California Candy Cultivators menu.',
  alternates: { canonical: '/signup' },
  robots: { index: false, follow: true }
};

export default async function SignupPage() {
  const { customer } = await currentCustomer();
  if (customer) redirect('/account');

  return (
    <AccountShell>
      <AccountForm mode="signup" />
    </AccountShell>
  );
}

import { redirect } from 'next/navigation';
import AccountShell from '../components/AccountShell';
import AccountForm from '../components/AccountForm';
import { currentCustomer } from '@/lib/account';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to view the current California Candy Cultivators menu.',
  alternates: { canonical: '/signin' },
  robots: { index: false, follow: true }
};

export default async function SigninPage() {
  const { customer, approved } = await currentCustomer();
  if (approved) redirect('/');
  if (customer) redirect('/account');

  return (
    <AccountShell>
      <AccountForm mode="signin" />
    </AccountShell>
  );
}

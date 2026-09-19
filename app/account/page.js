import { redirect } from 'next/navigation';
import Link from 'next/link';
import AccountShell from '../components/AccountShell';
import SignOutButton from '../components/SignOutButton';
import { currentCustomer } from '@/lib/account';
import { C, DISPLAY, MONO, SANS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your account',
  robots: { index: false, follow: false }
};

const COPY = {
  PENDING: {
    heading: 'Awaiting approval.',
    body:
      'Your account has been created and is waiting on manual review. We usually get to it within a business day. Once approved, the current menu will be visible here.'
  },
  REJECTED: {
    heading: 'Not approved.',
    body:
      'This account was not approved for menu access. If you believe that is a mistake, get in touch and we will take another look.'
  },
  SUSPENDED: {
    heading: 'Access paused.',
    body: 'Menu access on this account is currently paused. Contact us for details.'
  }
};

export default async function AccountPage() {
  const { customer, approved } = await currentCustomer();
  if (!customer) redirect('/signin');
  if (approved) redirect('/');

  const copy = COPY[customer.status] || COPY.PENDING;

  return (
    <AccountShell>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            font: '400 10px/1 ' + MONO,
            letterSpacing: '.34em',
            textTransform: 'uppercase',
            color: customer.status === 'PENDING' ? '#e0a04a' : '#9aa79c'
          }}
        >
          {customer.status}
        </div>

        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(28px,5vw,44px)',
            lineHeight: .95,
            letterSpacing: '-.03em',
            textTransform: 'uppercase',
            margin: '18px 0 0'
          }}
        >
          {copy.heading}
        </h1>

        <p style={{ font: '300 14px/1.7 ' + SANS, color: 'rgba(234,240,234,.66)', margin: '16px 0 0' }}>
          {copy.body}
        </p>

        <p style={{ font: '400 11px/1.7 ' + MONO, letterSpacing: '.08em', color: C.faint, margin: '22px 0 0' }}>
          Signed in as {customer.email}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 24px',
              border: '1px solid rgba(234,240,234,.2)', borderRadius: 2, color: C.dim,
              font: '600 11px/1 ' + SANS, letterSpacing: '.2em', textTransform: 'uppercase'
            }}
          >
            Back to site
          </Link>
          <SignOutButton />
        </div>
      </div>
    </AccountShell>
  );
}

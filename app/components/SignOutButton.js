'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { C, SANS } from '@/lib/constants';

export default function SignOutButton({ label = 'Sign out' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/account/session', { method: 'DELETE' });
    } finally {
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      style={{
        minHeight: 48,
        padding: '0 24px',
        border: '1px solid rgba(234,240,234,.14)',
        background: 'transparent',
        borderRadius: 2,
        color: C.faint,
        font: '600 11px/1 ' + SANS,
        letterSpacing: '.2em',
        textTransform: 'uppercase',
        cursor: busy ? 'default' : 'pointer'
      }}
    >
      {busy ? 'Signing out…' : label}
    </button>
  );
}

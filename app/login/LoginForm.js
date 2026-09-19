'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { C, DISPLAY, MONO, SANS } from '@/lib/constants';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Sign-in failed');
        setBusy(false);
        return;
      }
      router.replace('/admin');
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: C.panel,
          border: '1px solid ' + C.line,
          padding: 32
        }}
      >
        <div
          style={{
            font: '400 9.5px/1.5 ' + MONO,
            letterSpacing: '.28em',
            textTransform: 'uppercase',
            color: C.faint
          }}
        >
          California Candy Cultivators
        </div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 30,
            lineHeight: 1,
            letterSpacing: '-.02em',
            margin: '16px 0 0',
            textTransform: 'uppercase'
          }}
        >
          Admin
        </h1>
        <label
          htmlFor="password"
          style={{
            display: 'block',
            font: '400 9px/1 ' + MONO,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: C.faint,
            marginTop: 28
          }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{
            width: '100%',
            minHeight: 48,
            marginTop: 10,
            background: C.bg,
            border: '1px solid rgba(234,240,234,.16)',
            borderRadius: 2,
            color: C.text,
            padding: '0 13px',
            font: '400 14px/1 ' + SANS,
            outline: 'none'
          }}
        />
        {error ? (
          <div
            role="alert"
            style={{
              font: '400 10px/1.6 ' + MONO,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: C.amber,
              marginTop: 14
            }}
          >
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%',
            minHeight: 50,
            marginTop: 22,
            border: 0,
            background: busy ? '#1a2b21' : C.green,
            color: '#f4faf5',
            font: '600 11px/1 ' + SANS,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            borderRadius: 2
          }}
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>
        <Link
          href="/"
          style={{
            display: 'block',
            font: '400 9px/1 ' + MONO,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: C.faint,
            marginTop: 22
          }}
        >
          ← Public site
        </Link>
      </form>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { C, DISPLAY, MONO, SANS } from '@/lib/constants';

/**
 * Shared sign-in / sign-up form.
 *
 * One component for both so the two screens cannot drift in styling or in how
 * they report errors — a mismatch there is exactly what makes a login page feel
 * untrustworthy.
 */
export default function AccountForm({ mode }) {
  const isSignup = mode === 'signup';
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', password: '', website: ''
  });
  const [status, setStatus] = useState('editing');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (status === 'sending') return; // guards a double click
    setError('');
    setStatus('sending');

    try {
      const res = await fetch(isSignup ? '/api/account/signup' : '/api/account/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.');
        setStatus('editing');
        return;
      }

      if (isSignup) {
        setDone(true);
        setStatus('editing');
        return;
      }

      // refresh() re-runs the server components so the menu appears without a
      // full reload if the account is already approved.
      router.replace(data.status === 'APPROVED' ? '/' : '/account');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection.');
      setStatus('editing');
    }
  }

  const field = {
    width: '100%',
    minHeight: 52,
    padding: '0 14px',
    background: '#0a130d',
    border: '1px solid rgba(234,240,234,.16)',
    borderRadius: 2,
    color: C.text,
    // 16px minimum stops iOS Safari zooming the page on focus.
    font: '400 16px/1 ' + SANS
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={heading}>Request received.</h1>
        <p style={body}>
          Your account is pending review. We approve access manually, usually
          within a business day. You will be able to sign in and view the
          current menu once it is approved.
        </p>
        <Link href="/" style={linkBtn}>Back to site</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 style={heading}>{isSignup ? 'Request access' : 'Sign in'}</h1>
      <p style={body}>
        {isSignup
          ? 'The current menu is visible to approved accounts only. Tell us who you are and we will review it.'
          : 'Sign in to view the current menu.'}
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 30 }}>
        {isSignup ? (
          <>
            <input value={form.name} onChange={set('name')} placeholder="Name" autoComplete="name" required style={field} />
            <input value={form.phone} onChange={set('phone')} placeholder="Phone" type="tel" inputMode="tel" autoComplete="tel" required style={field} />
            <input value={form.company} onChange={set('company')} placeholder="Business name (optional)" autoComplete="organization" style={field} />
          </>
        ) : null}

        <input
          value={form.email}
          onChange={set('email')}
          placeholder="Email"
          type="email"
          inputMode="email"
          autoComplete={isSignup ? 'email' : 'username'}
          required
          style={field}
        />
        <input
          value={form.password}
          onChange={set('password')}
          placeholder={isSignup ? 'Password (8+ characters)' : 'Password'}
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          style={field}
        />

        {/* Honeypot — hidden from people, filled in by bots. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="cc-website">Website</label>
          <input id="cc-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
        </div>
      </div>

      {error ? (
        <p role="alert" style={{ font: '400 12px/1.6 ' + SANS, color: '#e0a04a', marginTop: 14 }}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          width: '100%',
          minHeight: 54,
          marginTop: 20,
          border: 0,
          borderRadius: 2,
          background: C.green,
          color: '#f4faf5',
          font: '600 12px/1 ' + SANS,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          opacity: status === 'sending' ? .6 : 1,
          cursor: status === 'sending' ? 'default' : 'pointer'
        }}
      >
        {status === 'sending' ? 'Working…' : isSignup ? 'Request access' : 'Sign in'}
      </button>

      <p style={{ font: '400 11px/1.7 ' + MONO, letterSpacing: '.1em', color: C.dim, marginTop: 22, textAlign: 'center' }}>
        {isSignup ? (
          <>Already have an account? <Link href="/signin" style={{ color: C.accent }}>Sign in</Link></>
        ) : (
          <>No account yet? <Link href="/signup" style={{ color: C.accent }}>Request access</Link></>
        )}
      </p>
    </form>
  );
}

const heading = {
  fontFamily: DISPLAY,
  fontSize: 'clamp(28px,5vw,44px)',
  lineHeight: .95,
  letterSpacing: '-.03em',
  textTransform: 'uppercase',
  margin: 0
};

const body = {
  font: '300 14px/1.7 ' + SANS,
  color: 'rgba(234,240,234,.66)',
  margin: '16px 0 0'
};

const linkBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 50,
  padding: '0 28px',
  marginTop: 26,
  border: '1px solid rgba(234,240,234,.2)',
  borderRadius: 2,
  color: C.dim,
  font: '600 11px/1 ' + SANS,
  letterSpacing: '.22em',
  textTransform: 'uppercase'
};

'use client';

import Link from 'next/link';
import { C, DISPLAY, MONO, SANS } from '@/lib/constants';

/**
 * Route-level error boundary.
 *
 * Without this, a data-layer failure renders Next's default error screen —
 * off-brand, and it gives the visitor nothing to do. The underlying error is
 * logged server-side; the visitor sees a way forward, not a stack trace.
 */
export default function Error({ error, reset }) {
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 32,
        textAlign: 'center'
      }}
    >
      <h1
        style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(28px,5vw,52px)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '-.03em'
        }}
      >
        The menu did not load
      </h1>
      <p style={{ font: '300 14px/1.6 ' + SANS, color: C.dim, maxWidth: '46ch' }}>
        Something on our side failed while fetching the current batches. Try
        again — if it keeps happening, call us and we will read you the menu.
      </p>
      {error?.digest ? (
        <code
          style={{
            font: '400 10px/1.6 ' + MONO,
            letterSpacing: '.14em',
            color: C.faint,
            textTransform: 'uppercase'
          }}
        >
          Ref {error.digest}
        </code>
      ) : null}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <button
          onClick={reset}
          style={{
            minHeight: 50,
            padding: '0 30px',
            border: 0,
            borderRadius: 2,
            background: C.green,
            color: '#f4faf5',
            font: '600 12px/1 ' + SANS,
            letterSpacing: '.24em',
            textTransform: 'uppercase'
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 50,
            padding: '0 30px',
            border: '1px solid rgba(234,240,234,.2)',
            borderRadius: 2,
            color: C.dim,
            font: '600 12px/1 ' + SANS,
            letterSpacing: '.24em',
            textTransform: 'uppercase'
          }}
        >
          Home
        </Link>
      </div>
    </main>
  );
}

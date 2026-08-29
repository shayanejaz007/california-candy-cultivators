'use client';

/**
 * Last-resort App Router boundary. This catches failures above a normal route
 * error boundary (including root layout/render failures) so production never
 * falls back to Next's opaque generic screen without a useful reference.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#050a07', color: '#eaf0ea', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 28 }}>
          <div style={{ width: 'min(100%, 560px)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .55 }}>
              California Candy Cultivators
            </div>
            <h1 style={{ margin: '18px 0 10px', fontSize: 'clamp(30px,7vw,56px)', lineHeight: .95, textTransform: 'uppercase' }}>
              Site temporarily unavailable
            </h1>
            <p style={{ margin: '0 auto', maxWidth: 460, lineHeight: 1.65, opacity: .65 }}>
              The page hit an unexpected render error. Reload once; if it continues, use the reference below in the deployment logs.
            </p>
            {error?.digest ? (
              <div style={{ marginTop: 18, fontFamily: 'monospace', fontSize: 11, letterSpacing: '.12em', opacity: .45 }}>
                REF {error.digest}
              </div>
            ) : null}
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 26, minHeight: 48, padding: '0 28px', border: '1px solid rgba(234,240,234,.22)', background: '#1d4230', color: '#fff', borderRadius: 3, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}
            >
              Reload site
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

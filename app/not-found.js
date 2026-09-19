import Link from 'next/link';
import { DISPLAY, MONO } from '@/lib/constants';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        textAlign: 'center'
      }}
    >
      <h1
        style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(32px,6vw,64px)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '-.03em'
        }}
      >
        Not found
      </h1>
      <p
        style={{
          font: '400 10px/1.6 ' + MONO,
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: 'rgba(234,240,234,.4)'
        }}
      >
        That page or strain is no longer on the menu.
      </p>
      <Link
        href="/"
        style={{
          font: '600 11px/1 Archivo, sans-serif',
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: '#7fb495'
        }}
      >
        Back to the site
      </Link>
    </main>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { C, MONO } from '@/lib/constants';

export default function Footer() {
  return (
    <footer style={{ maxWidth: 1320, margin: '0 auto', padding: '120px 24px 120px' }}>
      <div
        style={{
          borderTop: '1px solid ' + C.line,
          paddingTop: 32,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 32,
          alignItems: 'start'
        }}
      >
        <div>
          <Image
            src="/brand/ccc-mark-nav.png"
            alt="California Candy Cultivators"
            width={240}
            height={240}
            style={{ width: 82, height: 82, objectFit: 'contain' }}
          />
        </div>
        <div
          style={{
            font: '400 10px/2 ' + MONO,
            letterSpacing: '.18em',
            color: 'rgba(234,240,234,.4)',
            textTransform: 'uppercase'
          }}
        >
          <Link href="/#menu">Menu</Link><br />
          <Link href="/#cultivation">Cultivation</Link><br />
          <Link href="/#drops">Drops</Link><br />
          <Link href="/#contact">Contact</Link>
        </div>
        <div
          style={{
            font: '400 10px/2 ' + MONO,
            letterSpacing: '.18em',
            color: 'rgba(234,240,234,.4)',
            textTransform: 'uppercase'
          }}
        >
          <Link href="/privacy">Privacy</Link><br />
          <Link href="/terms">Terms</Link><br />
          <Link href="/login" rel="nofollow">Admin</Link>
        </div>
      </div>
    </footer>
  );
}

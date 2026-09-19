import Nav from './Nav';
import Footer from './Footer';
import { C } from '@/lib/constants';

/** Centred, full-height shell for the account screens. */
export default function AccountShell({ children }) {
  return (
    <>
      <Nav />
      <main
        id="main"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '140px 24px 80px',
          background: 'radial-gradient(ellipse at 50% 30%,#0d2417 0%,' + C.bg + ' 70%)'
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>{children}</div>
      </main>
      <Footer />
    </>
  );
}

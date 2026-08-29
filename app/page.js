import { cookies } from 'next/headers';
import Nav from './components/Nav';
import Footer from './components/Footer';
import SiteBody from './components/SiteBody';
import AgeGate from './components/AgeGate';
import { isAgeVerified } from '@/lib/age';
import { publicMenu, comingSoon } from '@/lib/db';

export const dynamic = 'force-dynamic';

function logDataFailure(source, reason) {
  const message = reason instanceof Error ? reason.message : String(reason || 'Unknown error');
  const code = reason?.code || reason?.status || reason?.name || 'UNKNOWN';
  // Details remain in Vercel Function Logs and are not rendered into the page.
  console.error(`[home-data] ${source} failed`, { code, message });
}

export default async function HomePage() {
  // Public rendering is deliberately fail-soft. A temporary database outage,
  // missing schema, or bad environment variable must never take down the age
  // gate, branding, legal pages, or contact surface.
  const [menuResult, dropsResult, cookieResult] = await Promise.allSettled([
    publicMenu(),
    comingSoon(),
    cookies()
  ]);

  const menu = menuResult.status === 'fulfilled' ? menuResult.value : [];
  const drops = dropsResult.status === 'fulfilled' ? dropsResult.value : [];
  const jar = cookieResult.status === 'fulfilled' ? cookieResult.value : null;

  if (menuResult.status === 'rejected') logDataFailure('publicMenu', menuResult.reason);
  if (dropsResult.status === 'rejected') logDataFailure('comingSoon', dropsResult.reason);
  if (cookieResult.status === 'rejected') logDataFailure('cookies', cookieResult.reason);

  const dataUnavailable =
    menuResult.status === 'rejected' || dropsResult.status === 'rejected';
  const feature = menu.find((s) => s.featured) || null;

  const ageVerified = isAgeVerified(jar);

  return (
    <>
      <AgeGate
        limit={Number(process.env.NEXT_PUBLIC_AGE_LIMIT) || 21}
        verified={ageVerified}
      />
      <Nav />
      <main id="main">
        <SiteBody
          menu={menu}
          drops={drops}
          feature={feature}
          dataUnavailable={dataUnavailable}
        />
      </main>
      <Footer />
    </>
  );
}

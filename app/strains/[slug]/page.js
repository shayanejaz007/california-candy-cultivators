import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import AgeGate from '../../components/AgeGate';
import { isAgeVerified } from '@/lib/age';
import StrainDetail from './StrainDetail';
import { allStrains, getStrain } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const strain = await getStrain(slug);
  if (!strain || !strain.visible) return { title: 'Strain not found' };

  const genetics = [strain.parentA, strain.parentB].filter(Boolean).join(' × ');
  const description =
    strain.description || (genetics ? genetics + '. Small-batch California flower.' : undefined);

  return {
    title: strain.name,
    description,
    alternates: { canonical: '/strains/' + strain.slug },
    openGraph: {
      type: 'article',
      title: strain.name,
      description,
      url: '/strains/' + strain.slug
    }
  };
}

export default async function StrainPage({ params }) {
  const { slug } = await params;
  const strain = await getStrain(slug);
  if (!strain || !strain.visible) notFound();

  const [all, jar] = await Promise.all([allStrains(), cookies()]);

  // Related strains must be on the live menu. The previous filter only checked
  // `visible`, so a COMING SOON strain could surface here and link through to a
  // page with no genetics, no batch and no availability.
  const related = all
    .filter((s) => s.visible && s.status !== 'COMING SOON' && s.slug !== strain.slug)
    .slice(0, 3);

  return (
    <>
      <AgeGate
        limit={Number(process.env.NEXT_PUBLIC_AGE_LIMIT) || 21}
        verified={isAgeVerified(jar)}
      />
      <Nav />
      <main id="main">
        <StrainDetail strain={strain} related={related} />
      </main>
      <Footer />
    </>
  );
}

import Nav from '../components/Nav';
import Footer from '../components/Footer';
import LegalPage from '../components/LegalPage';
import { LAST_UPDATED } from '@/lib/legal';

export const metadata = {
  title: 'Terms',
  description: 'The terms that apply to using the California Candy Cultivators site.',
  alternates: { canonical: '/terms' }
};

const sections = [
  {
    heading: 'Who this site is for',
    body: [
      'This site is intended only for adults of legal age in a jurisdiction where cannabis is lawful. By entering, you confirm you meet that requirement. Misrepresenting your age is a breach of these terms.'
    ]
  },
  {
    heading: 'This is not an offer to sell',
    body: [
      'Everything on this site is informational. The menu describes what exists, not what is for sale to you. No cart, checkout, payment or ordering function is provided, and submitting an inquiry does not create a contract, a reservation or an obligation on either side.',
      'Any transaction that follows an inquiry happens separately and only between appropriately licensed parties, through licensed channels, in compliance with California law.'
    ]
  },
  {
    heading: 'Accuracy',
    body: [
      'Availability, quantities and batch details change constantly and may be out of date by the time you read them. We correct errors as we find them but make no warranty that any listing is current or complete.'
    ]
  },
  {
    heading: 'No health claims',
    body: [
      'Nothing here is medical advice, and no statement on this site has been evaluated by the FDA. We make no claim that any product diagnoses, treats, cures or prevents any condition.'
    ]
  },
  {
    heading: 'Intellectual property',
    body: [
      'The photography, video, copy, strain names and marks on this site belong to us. Do not reproduce or republish them without written permission.'
    ]
  },
  {
    heading: 'Limitation of liability',
    body: [
      'The site is provided as-is. To the fullest extent the law allows, we are not liable for any loss arising from your use of it or from reliance on anything published here.'
    ]
  },
  {
    heading: 'Governing law',
    body: [
      'These terms are governed by the laws of the State of California, without regard to its conflict-of-law rules.'
    ]
  }
];

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <LegalPage title="Terms" updated={LAST_UPDATED} sections={sections} />
      </main>
      <Footer />
    </>
  );
}

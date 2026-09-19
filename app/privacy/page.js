import Nav from '../components/Nav';
import Footer from '../components/Footer';
import LegalPage from '../components/LegalPage';
import { LAST_UPDATED } from '@/lib/legal';

export const metadata = {
  title: 'Privacy',
  description: 'What California Candy Cultivators collects, why, and how to have it deleted.',
  alternates: { canonical: '/privacy' }
};

const sections = [
  {
    heading: 'What we collect',
    body: [
      'If you send an inquiry, we store the name, phone number, email address and message you type into the form, plus the strain the inquiry came from and the time you sent it. Nothing else on this site collects personal information.',
      'We do not run advertising trackers, analytics pixels or third-party cookies. The only browser storage we set is a flag recording that you passed the age gate, so you are not asked again on every page.'
    ]
  },
  {
    heading: 'Why we collect it',
    body: [
      'Solely to answer your inquiry. We use your phone number and email to reply about availability, batches and pricing. We do not sell, rent or share this information with anyone, and we do not add you to a marketing list unless you ask us to.'
    ]
  },
  {
    heading: 'How long we keep it',
    body: [
      'Inquiries are kept for two years so we can maintain a record of who we have spoken to, then deleted. You can ask us to delete yours sooner at any time.'
    ]
  },
  {
    heading: 'Your rights',
    body: [
      'If you are a California resident, the CCPA gives you the right to know what personal information we hold about you, to have it deleted, to have it corrected, and not to be discriminated against for exercising those rights.',
      'To make a request, contact us using the details in the footer. We will verify your identity against the inquiry on file before acting on it, and respond within 45 days.'
    ]
  },
  {
    heading: 'Security',
    body: [
      'Inquiries are stored on servers we control and are readable only by staff who are signed in to the admin panel. The site is served over HTTPS only.'
    ]
  },
  {
    heading: 'Changes',
    body: [
      'If this policy changes materially, we will update the date at the top of this page. Continued use of the site after a change means you accept the revised policy.'
    ]
  }
];

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <LegalPage title="Privacy" updated={LAST_UPDATED} sections={sections} />
      </main>
      <Footer />
    </>
  );
}

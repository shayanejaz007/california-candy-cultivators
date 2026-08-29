import localFont from 'next/font/local';
import './globals.css';
import { SITE_NAME, siteUrl } from '@/lib/site';

/**
 * Fonts are vendored into app/fonts and loaded with next/font/local.
 *
 * next/font/google downloads from fonts.googleapis.com during `next build`.
 * That makes every production build depend on a third-party host being
 * reachable — a transient DNS or network blip on the build machine fails the
 * deploy outright, which is exactly what happened in a restricted CI here.
 * The .woff2 files are byte-identical to what Google serves (taken from the
 * @fontsource packages), so rendering is unchanged and builds are hermetic.
 *
 * Either way the files are served from this origin, so no visitor IP reaches a
 * third party on page load.
 */
const archivo = localFont({
  src: [
    { path: './fonts/archivo-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/archivo-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/archivo-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/archivo-latin-600-normal.woff2', weight: '600', style: 'normal' }
  ],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  // Metric overrides keep the fallback occupying the same space as the real
  // face, so the swap does not shift layout (a CLS win on slow connections).
  adjustFontFallback: 'Arial'
});

const archivoBlack = localFont({
  src: [
    { path: './fonts/archivo-black-latin-400-normal.woff2', weight: '400', style: 'normal' }
  ],
  display: 'swap',
  variable: '--font-display',
  fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial'
});

/**
 * Open Graph card.
 *
 * Was /brand/ccc-logo-original.png at 896x1200. Social platforms centre-crop to
 * roughly 1.91:1, so a portrait image lost the wordmark entirely. This is a
 * purpose-built 1200x630 card, and it is opaque — transparency renders on
 * white on most platforms.
 */
const OG_IMAGE = {
  url: '/brand/og-card.jpg',
  width: 1200,
  height: 630,
  alt: 'California Candy Cultivators'
};

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: '%s — ' + SITE_NAME
  },
  description:
    'Small-batch California flower, selected by phenotype and released by the batch.',
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      'Small-batch California flower, selected by phenotype and released by the batch.',
    url: '/',
    images: [OG_IMAGE]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Small-batch California flower, released by the batch.',
    images: [OG_IMAGE]
  }
};

export const viewport = {
  themeColor: '#050a07',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={archivo.variable + ' ' + archivoBlack.variable}>
      <body>{children}</body>
    </html>
  );
}

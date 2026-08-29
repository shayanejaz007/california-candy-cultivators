import { SITE_NAME } from '@/lib/site';

/**
 * Web app manifest.
 *
 * Replaces a stray public/meta.json that nothing referenced and that no browser
 * would have requested — it was a leftover, not a manifest, and only ever
 * surfaced in logs when something probed for it.
 *
 * Next serves this at /manifest.webmanifest and links it from <head>
 * automatically. It matters here because the menu is a mobile-first page people
 * revisit: this is what makes "Add to Home Screen" show the brand mark and open
 * without browser chrome.
 */
export default function manifest() {
  return {
    name: SITE_NAME,
    short_name: 'CCC',
    description:
      'Small-batch California flower, selected by phenotype and released by the batch.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050a07',
    theme_color: '#050a07',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  };
}

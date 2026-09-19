import { siteUrl } from '@/lib/site';

/**
 * Only publicly viewable pages are listed.
 *
 * Strain pages used to be here. Now that the menu is approval-gated, listing
 * them would publish every strain slug — and by extension the catalogue — to
 * anyone who opens /sitemap.xml, while also pointing crawlers at URLs that
 * redirect. Both defeat the point of gating it.
 */
export default function sitemap() {
  const base = siteUrl();
  const now = new Date();

  return [
    { url: base + '/', lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: base + '/signup', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: base + '/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.2 }
  ];
}

import { publicMenu } from '@/lib/db';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes = [
    { url: base + '/', changeFrequency: 'daily', priority: 1 },
    { url: base + '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { url: base + '/terms', changeFrequency: 'yearly', priority: 0.2 }
  ];

  let strains = [];
  try {
    strains = await publicMenu();
  } catch {
    // A data-layer outage should degrade the sitemap, not break the build.
    strains = [];
  }

  return [
    ...staticRoutes.map((r) => ({ ...r, lastModified: now })),
    ...strains.map((s) => ({
      url: base + '/strains/' + s.slug,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8
    }))
  ];
}

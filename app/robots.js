import { siteUrl } from '@/lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The admin surface and the API are not content. Excluding them keeps
        // them out of search results and out of scraped training corpora.
        disallow: ['/admin', '/admin/', '/login', '/api/']
      }
    ],
    sitemap: siteUrl() + '/sitemap.xml',
    host: siteUrl()
  };
}

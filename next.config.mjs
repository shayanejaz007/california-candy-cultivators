/** @type {import('next').NextConfig} */

/**
 * Content-Security-Policy.
 *
 * 'unsafe-inline' is present on script-src because Next's App Router injects
 * inline bootstrap and flight-data scripts. Removing it requires nonce-based
 * CSP via middleware; docs/SECURITY.md describes that upgrade path.
 *
 * style-src needs 'unsafe-inline' too, because this codebase styles with React
 * inline style={{}} objects rather than classes.
 *
 * Fonts are self-hosted through next/font, so font-src is 'self' only and no
 * third-party font request leaves the visitor's browser.
 */
const dev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // frame-ancestors above supersedes this; kept for older browsers.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
];

const noStore = {
  key: 'Cache-Control',
  value: 'no-store, max-age=0, must-revalidate'
};

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: false },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // The admin surface must never be cached by a CDN or shared proxy.
        source: '/admin/:path*',
        headers: [noStore, { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]
      },
      {
        source: '/api/:path*',
        headers: [noStore, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      },
      {
        source: '/login',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]
      }
    ];
  }
};

export default nextConfig;

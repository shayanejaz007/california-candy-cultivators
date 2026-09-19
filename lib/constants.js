export const STATUSES = ['AVAILABLE', 'LOW STOCK', 'COMING SOON', 'SOLD OUT'];

/**
 * Status colours.
 *
 * Every value clears WCAG AA (4.5:1) against the card background #0a130d.
 * The previous SOLD OUT value was rgba(234,240,234,0.4), which measured about
 * 3.1:1 and was unreadable for low-vision users, and LOW STOCK and COMING SOON
 * shared one amber, so the two states were indistinguishable at a glance.
 */
export const STATUS_COLOR = {
  'AVAILABLE': '#63b487',
  'LOW STOCK': '#e0a04a',
  'COMING SOON': '#7ea8d8',
  'SOLD OUT': '#9aa79c'
};

export const C = {
  bg: '#050a07',
  panel: '#070f0a',
  card: '#0a130d',
  line: 'rgba(234,240,234,.1)',
  text: '#eaf0ea',
  dim: 'rgba(234,240,234,.55)',
  faint: 'rgba(234,240,234,.35)',
  accent: '#7fb495',
  green: '#2f6b4a',
  greenHi: '#3d8a5f',
  greenDeep: '#1d4230',
  amber: '#c68b3c'
};

// --font-sans / --font-display are set on <html> by next/font in app/layout.js.
// Referencing the variables rather than the family names means the self-hosted
// files are used and the fallback stack applies only while they load.
export const MONO = "ui-monospace, Menlo, Monaco, 'Cascadia Mono', monospace";
export const SANS = "var(--font-sans), Helvetica, Arial, sans-serif";
export const DISPLAY = "var(--font-display), Helvetica, Arial, sans-serif";

/**
 * Hero media.
 *
 * These were previously hotlinked to a third-party CDN at a path containing a
 * generator account id. That leaked which account produced the asset, put the
 * homepage's largest render on infrastructure nobody here controls, and would
 * have broken silently whenever that object was rotated or expired.
 *
 * Put the encoded files in /public/media/ and the poster frames beside them.
 * See docs/MEDIA_MANAGEMENT.md for target bitrates and dimensions.
 */
export const HERO_LANDSCAPE = '/hero-landscape.mp4';
export const HERO_VERTICAL = '/hero-vertical.mp4';
export const HERO_POSTER_LANDSCAPE = '/hero-landscape.jpg';
export const HERO_POSTER_VERTICAL = '/hero-vertical.jpg';

export const placeholder =
  'repeating-linear-gradient(135deg,#101d14 0 10px,#0c1710 10px 20px)';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Formats an ISO timestamp identically on the server and in the browser.
 * Intl/toLocaleDateString reads the host timezone, which differs between the
 * two and produces a React hydration warning.
 *
 * The year is included once a date falls outside the current one; without it,
 * an inquiry from last April and one from this April read identically in the
 * admin table.
 */
export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const stamp = MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
  const thisYear = new Date().getUTCFullYear();
  return d.getUTCFullYear() === thisYear ? stamp : stamp + ' ' + d.getUTCFullYear();
}

import { C, DISPLAY, MONO, SANS } from '@/lib/constants';

/** Shared layout for /privacy and /terms. */
export default function LegalPage({ title, updated, sections }) {
  return (
    <article style={{ maxWidth: 780, margin: '0 auto', padding: '150px 24px 40px' }}>
      <div
        style={{
          font: '400 10px/1 ' + MONO,
          letterSpacing: '.36em',
          color: C.accent,
          textTransform: 'uppercase'
        }}
      >
        Last updated {updated}
      </div>
      <h1
        style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(34px,6.4vw,72px)',
          lineHeight: .9,
          letterSpacing: '-.035em',
          margin: '18px 0 0',
          textTransform: 'uppercase'
        }}
      >
        {title}
      </h1>

      {sections.map((section) => (
        <section key={section.heading} style={{ marginTop: 52 }}>
          <h2
            style={{
              font: '600 11px/1.4 ' + SANS,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: C.accent,
              margin: 0,
              paddingBottom: 14,
              borderBottom: '1px solid ' + C.line
            }}
          >
            {section.heading}
          </h2>
          {section.body.map((paragraph, i) => (
            <p
              key={i}
              style={{
                font: '300 15px/1.75 ' + SANS,
                color: 'rgba(234,240,234,.72)',
                margin: '18px 0 0'
              }}
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <p
        style={{
          font: '400 10px/1.8 ' + MONO,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: C.faint,
          margin: '64px 0 0',
          paddingTop: 24,
          borderTop: '1px solid ' + C.line
        }}
      >
        This page is a starting draft, not legal advice. Have counsel review it
        before launch.
      </p>
    </article>
  );
}

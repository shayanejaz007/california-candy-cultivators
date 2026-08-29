'use client';

import { useMemo, useState } from 'react';
import Hero from './Hero';
import StrainCard from './StrainCard';
import InquiryModal from './InquiryModal';
import StickyMenuCta from './StickyMenuCta';
import { C, DISPLAY, MONO, SANS, placeholder } from '@/lib/constants';

const FILTERS = ['ALL', 'AVAILABLE', 'LOW STOCK', 'SOLD OUT'];
const coverFor = (strain) => (strain?.media || []).find((m) => m.isCover) || (strain?.media || [])[0] || null;

const pillars = [
  ['40:1', 'Seeds hunted per keeper'],
  ['9–10', 'Weeks in flower'],
  ['14', 'Day slow cure'],
  ['12–40', 'Plants per run']
];

export default function SiteBody({ menu = [], drops = [], feature, dataUnavailable = false }) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [inquiry, setInquiry] = useState(null); // null | { strain }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter((s) => {
      if (filter !== 'ALL' && s.status !== filter) return false;
      if (!q) return true;
      const hay = [s.name, s.parentA, s.parentB, (s.flavor || []).join(' ')]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [menu, filter, query]);

  const kicker = {
    font: '400 10px/1 ' + MONO,
    letterSpacing: '.36em',
    color: C.accent,
    textTransform: 'uppercase'
  };
  const h2 = {
    fontFamily: DISPLAY,
    fontSize: 'clamp(34px,6.4vw,80px)',
    lineHeight: .88,
    letterSpacing: '-.035em',
    margin: '18px 0 0',
    textTransform: 'uppercase'
  };

  return (
    <>
      <StickyMenuCta count={menu.filter((s) => s.status === 'AVAILABLE').length} />
      <Hero />

      <section id="menu" style={{ maxWidth: 1320, margin: '0 auto', padding: '112px 24px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(234,240,234,.12)',
            paddingBottom: 22
          }}
        >
          <div>
            <div style={kicker}>01 — Live inventory</div>
            <h2 style={{ ...h2, fontSize: 'clamp(32px,6vw,72px)' }}>Current menu</h2>
          </div>
          <div
            style={{
              font: '400 11px/1.5 ' + MONO,
              color: 'rgba(234,240,234,.4)',
              textAlign: 'right',
              textTransform: 'uppercase',
              letterSpacing: '.12em'
            }}
          >
            {dataUnavailable ? (
              <>Menu syncing</>
            ) : (
              <>
                {menu.filter((s) => s.status === 'AVAILABLE').length} available ·{' '}
                {menu.length} on menu
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
            padding: '22px 0 34px'
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={on}
                  style={{
                    minHeight: 40,
                    padding: '0 18px',
                    border: '1px solid ' + (on ? C.greenHi : 'rgba(234,240,234,.16)'),
                    background: on ? C.greenDeep : 'transparent',
                    color: on ? '#dff0e5' : 'rgba(234,240,234,.6)',
                    font: '600 10.5px/1 ' + SANS,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    borderRadius: 2
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search strains"
            aria-label="Search strains"
            style={{
              minHeight: 40,
              minWidth: 230,
              flex: '0 1 300px',
              background: '#0b150f',
              border: '1px solid rgba(234,240,234,.14)',
              borderRadius: 2,
              color: C.text,
              padding: '0 14px',
              font: '400 12px/1 ' + SANS,
              outline: 'none'
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(288px,1fr))',
            gap: 20
          }}
        >
          {visible.map((s) => (
            <StrainCard key={s.slug} strain={s} onInquire={(name) => setInquiry(name)} />
          ))}
        </div>

        {visible.length === 0 ? (
          <div
            style={{
              padding: '64px 0',
              textAlign: 'center',
              font: '400 11px/1.6 ' + MONO,
              letterSpacing: '.2em',
              color: 'rgba(234,240,234,.35)',
              textTransform: 'uppercase'
            }}
          >
            {dataUnavailable
              ? 'Current menu is temporarily unavailable — please check back shortly'
              : 'No strains match that filter'}
          </div>
        ) : null}
      </section>

      {feature ? (
        <section style={{ maxWidth: 1320, margin: '0 auto', padding: '104px 24px 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
              border: '1px solid ' + C.line,
              background: C.card
            }}
          >
            <div style={{ aspectRatio: '1 / 1', minHeight: 360, background: placeholder, position: 'relative', overflow: 'hidden' }}>
              {coverFor(feature) ? (coverFor(feature).type === 'video' ? <video src={coverFor(feature).url} muted playsInline loop autoPlay preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={coverFor(feature).url} alt={coverFor(feature).alt || feature.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 9.5px/1.7 ' + MONO, letterSpacing: '.2em', color: 'rgba(234,240,234,.3)', textTransform: 'uppercase', textAlign: 'center', padding: 24 }}>Featured strain media</div>}
            </div>
            <div
              style={{
                padding: 'clamp(28px,4vw,58px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div style={kicker}>This week&apos;s feature</div>
              <h2 style={{ ...h2, fontSize: 'clamp(34px,5.4vw,62px)' }}>{feature.name}</h2>
              <div
                style={{
                  font: '500 13px/1.4 ' + SANS,
                  color: C.accent,
                  marginTop: 14,
                  letterSpacing: '.04em'
                }}
              >
                {feature.parentA} × {feature.parentB}
              </div>
              <p
                style={{
                  font: '300 15px/1.75 ' + SANS,
                  color: 'rgba(234,240,234,.6)',
                  margin: '22px 0 0',
                  maxWidth: '46ch'
                }}
              >
                {feature.description}
              </p>
              <div style={{ display: 'flex', gap: 34, marginTop: 30, flexWrap: 'wrap' }}>
                {[
                  ['Batch', feature.batchName],
                  ['Harvest', feature.harvest],
                  ['Availability', feature.status]
                ].map(([label, value]) => (
                  <div key={label}>
                    <div
                      style={{
                        font: '400 9px/1 ' + MONO,
                        letterSpacing: '.24em',
                        color: 'rgba(234,240,234,.35)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ font: '500 13px/1 ' + SANS, marginTop: 8 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <button
                  onClick={() => setInquiry(feature.name)}
                  style={{
                    minHeight: 52,
                    padding: '0 32px',
                    border: 0,
                    background: C.green,
                    color: '#f4faf5',
                    font: '600 12px/1 ' + SANS,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    borderRadius: 2
                  }}
                >
                  Inquire about this batch
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="cultivation" style={{ maxWidth: 1320, margin: '0 auto', padding: '120px 24px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            gap: 'clamp(28px,5vw,72px)',
            alignItems: 'start'
          }}
        >
          <div>
            <div style={kicker}>02 — Craft</div>
            <h2 style={h2}>The<br />cultivation</h2>
          </div>
          <div>
            <p
              style={{
                font: '300 clamp(16px,1.8vw,21px)/1.6 ' + SANS,
                color: 'rgba(234,240,234,.82)',
                margin: 0
              }}
            >
              Grown with patience, precision and respect for the genetics.
            </p>
            <p style={{ font: '300 14.5px/1.8 ' + SANS, color: C.dim, margin: '24px 0 0' }}>
              Every run starts with selection. We pheno-hunt in small numbers, keep
              only what earns its place, and cultivate in rooms small enough to walk
              plant by plant. Nothing is rushed to fill a shelf.
            </p>
            <p style={{ font: '300 14.5px/1.8 ' + SANS, color: C.dim, margin: '16px 0 0' }}>
              Hand-trimmed, slow-cured, and jarred by batch. When a batch is gone it
              is gone, and the next one is judged on its own terms.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
                border: '1px solid ' + C.line,
                marginTop: 38
              }}
            >
              {pillars.map(([value, label]) => (
                <div
                  key={label}
                  style={{
                    background: C.bg,
                    padding: '20px 16px',
                    boxShadow: 'inset -1px -1px 0 rgba(234,240,234,.1)'
                  }}
                >
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 26,
                      lineHeight: 1,
                      letterSpacing: '-.02em'
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      font: '400 9px/1.5 ' + MONO,
                      letterSpacing: '.18em',
                      color: 'rgba(234,240,234,.4)',
                      textTransform: 'uppercase',
                      marginTop: 10
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="drops" style={{ maxWidth: 1320, margin: '0 auto', padding: '120px 24px 0' }}>
        <div style={kicker}>03 — Incoming</div>
        <h2 style={h2}>Coming soon</h2>
        {drops.length === 0 ? (
          <div
            style={{
              padding: '56px 0',
              font: '400 10.5px/1.7 ' + MONO,
              letterSpacing: '.18em',
              color: 'rgba(234,240,234,.32)',
              textTransform: 'uppercase'
            }}
          >
            Nothing announced right now. Check back soon.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
              gap: 20,
              marginTop: 46
            }}
          >
            {drops.map((d) => (
              <article
                key={d.slug}
                style={{ border: '1px solid ' + C.line, background: C.card, overflow: 'hidden' }}
              >
                <div style={{ aspectRatio: '16 / 10', background: placeholder, position: 'relative', overflow: 'hidden' }}>
                  {coverFor(d) ? (coverFor(d).type === 'video' ? <video src={coverFor(d).url} muted playsInline loop autoPlay preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={coverFor(d).url} alt={coverFor(d).alt || d.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 9.5px/1.7 ' + MONO, letterSpacing: '.2em', color: 'rgba(234,240,234,.3)', textTransform: 'uppercase' }}>Drop media</div>}
                </div>
                <div style={{ padding: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber }} />
                    <span
                      style={{
                        font: '600 9.5px/1 ' + SANS,
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color: C.amber
                      }}
                    >
                      Coming soon
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 'clamp(26px,3.4vw,38px)',
                      lineHeight: .95,
                      letterSpacing: '-.025em',
                      margin: '16px 0 0',
                      textTransform: 'uppercase'
                    }}
                  >
                    {d.name}
                  </h3>
                  <div
                    style={{
                      font: '500 12px/1.4 ' + SANS,
                      color: C.accent,
                      marginTop: 10,
                      letterSpacing: '.04em'
                    }}
                  >
                    {d.parentA} × {d.parentB}
                  </div>
                  <p style={{ font: '300 14px/1.7 ' + SANS, color: C.dim, margin: '18px 0 0' }}>
                    {d.teaser || d.description}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      marginTop: 26,
                      paddingTop: 20,
                      borderTop: '1px solid rgba(234,240,234,.09)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div
                      style={{
                        font: '400 10px/1.4 ' + MONO,
                        letterSpacing: '.16em',
                        color: 'rgba(234,240,234,.42)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {d.release ? 'Expected ' + d.release : 'Date to be announced'}
                    </div>
                    <button
                      onClick={() => setInquiry(d.name)}
                      style={{
                        minHeight: 44,
                        padding: '0 20px',
                        border: '1px solid rgba(234,240,234,.2)',
                        background: 'transparent',
                        color: 'rgba(234,240,234,.85)',
                        font: '600 10px/1 ' + SANS,
                        letterSpacing: '.18em',
                        textTransform: 'uppercase',
                        borderRadius: 2
                      }}
                    >
                      Notify me
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="contact" style={{ maxWidth: 1320, margin: '0 auto', padding: '120px 24px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            gap: 'clamp(28px,5vw,72px)'
          }}
        >
          <div>
            <div style={kicker}>04 — Contact</div>
            <h2 style={h2}>Inquire</h2>
            <p
              style={{
                font: '300 14.5px/1.8 ' + SANS,
                color: C.dim,
                margin: '24px 0 0',
                maxWidth: '40ch'
              }}
            >
              Pricing and availability are shared directly. Send a note and we will
              respond with current batch details.
            </p>
          </div>
          <div>
            <button
              onClick={() => setInquiry('')}
              style={{
                width: '100%',
                minHeight: 58,
                border: '1px solid rgba(234,240,234,.2)',
                background: C.card,
                color: C.text,
                font: '600 12px/1 ' + SANS,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              Open inquiry form
            </button>
            <div
              style={{
                font: '400 9.5px/1.7 ' + MONO,
                letterSpacing: '.16em',
                color: 'rgba(234,240,234,.3)',
                textTransform: 'uppercase',
                marginTop: 18
              }}
            >
              No cart, no checkout, no online payment. Inquiries only.
            </div>
          </div>
        </div>
      </section>

      {inquiry !== null ? (
        <InquiryModal strain={inquiry} onClose={() => setInquiry(null)} />
      ) : null}
    </>
  );
}

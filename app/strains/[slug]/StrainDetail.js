'use client';

import Link from 'next/link';
import { useState } from 'react';
import InquiryModal from '../../components/InquiryModal';
import { C, DISPLAY, MONO, SANS, STATUS_COLOR, placeholder } from '@/lib/constants';

export default function StrainDetail({ strain, related }) {
  const [open, setOpen] = useState(false);
  const color = STATUS_COLOR[strain.status] || C.dim;
  const media = [...(strain.media || [])].sort((a, b) => Number(Boolean(b.isCover)) - Number(Boolean(a.isCover)) || (a.sort || 0) - (b.sort || 0));
  const cover = media[0];

  const specs = [
    ['Genetics', strain.parentA + ' × ' + strain.parentB],
    ['Aroma', strain.aroma],
    ['Flavor', (strain.flavor || []).join(' • ')],
    ['Appearance', strain.appearance],
    ['Cultivation', strain.cultivation],
    ['Batch', strain.batchName + ' · ' + strain.batchNo],
    ['Harvest', strain.harvest],
    [
      'Availability',
      strain.status === 'SOLD OUT'
        ? 'Sold out'
        : strain.status === 'COMING SOON'
          ? 'In cure'
          : strain.qty + ' units available'
    ]
  ].filter(([, v]) => v && String(v).trim() && String(v).trim() !== '·');

  return (
    <section style={{ maxWidth: 1320, margin: '0 auto', padding: '112px 24px 0' }}>
      <Link
        href="/#menu"
        style={{
          display: 'inline-block',
          font: '500 10.5px/1 ' + SANS,
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: 'rgba(234,240,234,.5)',
          minHeight: 40,
          lineHeight: '40px'
        }}
      >
        ← Back to menu
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 'clamp(24px,4vw,56px)',
          marginTop: 26
        }}
      >
        <div>
          <div style={{ aspectRatio: '4 / 5', background: placeholder, border: '1px solid ' + C.line, position: 'relative', overflow: 'hidden' }}>
            {cover ? (cover.type === 'video' ? <video src={cover.url} controls muted playsInline preload="metadata" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={cover.url} alt={cover.alt || strain.name} decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 9.5px/1.7 ' + MONO, letterSpacing: '.2em', color: 'rgba(234,240,234,.32)', textTransform: 'uppercase' }}>Cover media</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 8 }}>
            {(media.length ? media.slice(0, 4) : [{ id: 'macro', label: 'Macro' }, { id: 'pack', label: 'Packaging' }, { id: 'room', label: 'Room' }, { id: 'video', label: 'Video' }]).map((t) => (
              <div
                key={t.id || t.url}
                style={{
                  aspectRatio: '1 / 1',
                  background: placeholder,
                  border: '1px solid rgba(234,240,234,.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '400 8px/1.4 ' + MONO,
                  letterSpacing: '.14em',
                  color: 'rgba(234,240,234,.3)',
                  textTransform: 'uppercase'
                }}
              >
                {t.url ? (t.type === 'video' ? <video src={t.url} muted playsInline preload="metadata" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={t.url} alt={t.alt || strain.name} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : t.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <span
              style={{
                font: '600 10px/1 ' + SANS,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                color
              }}
            >
              {strain.status}
            </span>
          </div>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(38px,7vw,88px)',
              lineHeight: .86,
              letterSpacing: '-.035em',
              margin: '18px 0 0',
              textTransform: 'uppercase'
            }}
          >
            {strain.name}
          </h1>
          <div
            style={{
              font: '500 clamp(13px,1.5vw,16px)/1.4 ' + SANS,
              color: C.accent,
              marginTop: 16,
              letterSpacing: '.04em'
            }}
          >
            {strain.parentA} × {strain.parentB}
          </div>
          <p
            style={{
              font: '300 15.5px/1.8 ' + SANS,
              color: 'rgba(234,240,234,.6)',
              margin: '26px 0 0',
              maxWidth: '52ch'
            }}
          >
            {strain.description}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              border: '1px solid ' + C.line,
              marginTop: 34
            }}
          >
            {specs.map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: C.bg,
                  padding: '18px 16px',
                  boxShadow: 'inset -1px -1px 0 rgba(234,240,234,.1)'
                }}
              >
                <div
                  style={{
                    font: '400 9px/1 ' + MONO,
                    letterSpacing: '.22em',
                    color: 'rgba(234,240,234,.35)',
                    textTransform: 'uppercase'
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    font: '400 13px/1.5 ' + SANS,
                    marginTop: 9,
                    color: 'rgba(234,240,234,.9)'
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26, border: '1px solid rgba(234,240,234,.12)', background: C.card }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(234,240,234,.1)', font: '400 9px/1 ' + MONO, letterSpacing: '.22em', color: C.dim, textTransform: 'uppercase' }}>Current pricing</div>
            {(strain.pricing || []).length ? (strain.pricing || []).map((tier, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 16px', borderBottom: i < strain.pricing.length - 1 ? '1px solid rgba(234,240,234,.07)' : 0 }}>
                <span style={{ font: '500 12px/1.4 ' + SANS }}>{tier.label}</span>
                <span style={{ font: '600 12px/1.4 ' + MONO, color: C.accent }}>{tier.price}</span>
              </div>
            )) : <div style={{ padding: '18px 16px', font: '400 10px/1.6 ' + MONO, letterSpacing: '.18em', color: C.dim, textTransform: 'uppercase' }}>Inquire for current pricing</div>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <button
              onClick={() => setOpen(true)}
              style={{
                minHeight: 54,
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
              Inquire about this strain
            </button>
            <Link
              href="/#menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 54,
                padding: '0 28px',
                border: '1px solid rgba(234,240,234,.2)',
                color: 'rgba(234,240,234,.8)',
                font: '600 12px/1 ' + SANS,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              Back to menu
            </Link>
          </div>
        </div>
      </div>

      {related.length ? (
        <div style={{ marginTop: 96, borderTop: '1px solid rgba(234,240,234,.12)', paddingTop: 26 }}>
          <div
            style={{
              font: '400 10px/1 ' + MONO,
              letterSpacing: '.3em',
              color: 'rgba(234,240,234,.4)',
              textTransform: 'uppercase'
            }}
          >
            Related
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
              gap: 16,
              marginTop: 22
            }}
          >
            {related.map((r) => (
              <Link
                key={r.slug}
                href={'/strains/' + r.slug}
                style={{
                  border: '1px solid rgba(234,240,234,.09)',
                  background: C.card,
                  padding: 22,
                  display: 'block'
                }}
              >
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 19,
                    lineHeight: 1,
                    letterSpacing: '-.02em',
                    textTransform: 'uppercase'
                  }}
                >
                  {r.name}
                </div>
                <div style={{ font: '500 11px/1.4 ' + SANS, color: C.accent, marginTop: 9 }}>
                  {r.parentA} × {r.parentB}
                </div>
                <div
                  style={{
                    font: '400 9.5px/1 ' + MONO,
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    marginTop: 14,
                    color: STATUS_COLOR[r.status] || C.dim
                  }}
                >
                  {r.status}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {open ? <InquiryModal strain={strain.name} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

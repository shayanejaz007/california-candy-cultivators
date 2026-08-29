'use client';

import Link from 'next/link';
import { C, DISPLAY, MONO, SANS, STATUS_COLOR, placeholder } from '@/lib/constants';

export default function StrainCard({ strain, onInquire }) {
  const color = STATUS_COLOR[strain.status] || C.dim;
  const cover = (strain.media || []).find((m) => m.isCover) || (strain.media || [])[0];
  const priceLabel = strain.pricing?.[0]?.price || 'Inquire for pricing';
  const qtyLabel =
    strain.status === 'SOLD OUT'
      ? 'Sold out'
      : strain.status === 'COMING SOON'
        ? 'In cure'
        : strain.qty + ' units available';

  return (
    <article
      style={{
        background: C.card,
        border: '1px solid rgba(234,240,234,.09)',
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Link
        href={'/strains/' + strain.slug}
        style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          background: placeholder,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 14
        }}
      >
        {cover ? (
          cover.type === 'video' ? (
            <video
              src={cover.url}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={cover.url}
              alt={cover.alt || strain.name}
              loading="lazy"
              decoding="async"
              // If the file is missing, hide the element so the gradient
              // placeholder behind it shows instead of a broken-image icon.
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 9.5px/1.6 ' + MONO, letterSpacing: '.2em', color: 'rgba(234,240,234,.3)', textTransform: 'uppercase' }}>Cover media</span>
        )}
        <span
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 10px',
            background: '#050a07d9',
            borderRadius: 2
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
          <span
            style={{
              font: '600 9.5px/1 ' + SANS,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color
            }}
          >
            {strain.status}
          </span>
        </span>
      </Link>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div>
          <h3
            style={{
              fontFamily: DISPLAY,
              fontSize: 22,
              lineHeight: 1,
              letterSpacing: '-.02em',
              margin: 0,
              textTransform: 'uppercase'
            }}
          >
            {strain.name}
          </h3>
          <div
            style={{
              font: '500 11.5px/1.4 ' + SANS,
              color: C.accent,
              marginTop: 8,
              letterSpacing: '.04em'
            }}
          >
            {strain.parentA} × {strain.parentB}
          </div>
        </div>
        <div
          style={{
            font: '400 10px/1.6 ' + MONO,
            letterSpacing: '.14em',
            color: 'rgba(234,240,234,.42)',
            textTransform: 'uppercase'
          }}
        >
          {(strain.flavor || []).join(' • ')}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            paddingTop: 12,
            marginTop: 'auto',
            borderTop: '1px solid rgba(234,240,234,.09)',
            font: '400 10px/1.4 ' + MONO,
            letterSpacing: '.12em',
            color: 'rgba(234,240,234,.42)',
            textTransform: 'uppercase'
          }}
        >
          <span>{qtyLabel}</span>
          <span>{priceLabel}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          <Link
            href={'/strains/' + strain.slug}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              border: '1px solid rgba(234,240,234,.18)',
              color: 'rgba(234,240,234,.85)',
              font: '600 10px/1 ' + SANS,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              borderRadius: 2
            }}
          >
            View strain
          </Link>
          <button
            onClick={() => onInquire(strain.name)}
            style={{
              minHeight: 44,
              border: 0,
              background: C.greenDeep,
              color: '#dff0e5',
              font: '600 10px/1 ' + SANS,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              borderRadius: 2
            }}
          >
            Inquire
          </button>
        </div>
      </div>
    </article>
  );
}

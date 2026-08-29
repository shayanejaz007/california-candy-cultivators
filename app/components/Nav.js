'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { C, SANS } from '@/lib/constants';

const items = [
  ['/#menu', 'Menu'],
  ['/#cultivation', 'Cultivation'],
  ['/#drops', 'Drops'],
  ['/#contact', 'Contact']
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const link = {
    font: '500 11px/1 ' + SANS,
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: 'rgba(234,240,234,.7)'
  };

  return (
    <>
      <a className="cc-skip" href="#main">
        Skip to content
      </a>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          minHeight: 76,
          padding: '10px 24px',
          background: 'linear-gradient(#050a07f0,#050a0700)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Link
          href="/"
          aria-label="California Candy Cultivators home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 58,
            height: 58
          }}
        >
          <Image
            src="/brand/ccc-mark-nav.png"
            alt=""
            width={240}
            height={240}
            priority
            style={{ width: 54, height: 54, objectFit: 'contain' }}
          />
        </Link>

        {compact ? (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="cc-mobile-nav"
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: '0 14px',
              background: 'transparent',
              border: '1px solid rgba(234,240,234,.2)',
              borderRadius: 2,
              color: C.text,
              font: '600 10px/1 ' + SANS,
              letterSpacing: '.2em',
              textTransform: 'uppercase'
            }}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        ) : (
          <nav aria-label="Primary" style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            {items.map(([href, label]) => (
              <Link key={href} href={href} style={link}>
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {compact && open ? (
        <nav
          id="cc-mobile-nav"
          aria-label="Primary"
          style={{
            position: 'fixed',
            top: 76,
            left: 0,
            right: 0,
            zIndex: 89,
            display: 'flex',
            flexDirection: 'column',
            background: C.panel,
            borderTop: '1px solid ' + C.line,
            borderBottom: '1px solid ' + C.line,
            animation: 'ccFade .18s ease'
          }}
        >
          {items.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                ...link,
                display: 'flex',
                alignItems: 'center',
                minHeight: 56,
                padding: '0 24px',
                borderBottom: '1px solid rgba(234,240,234,.06)'
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}

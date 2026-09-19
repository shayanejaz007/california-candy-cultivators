'use client';

import { useEffect, useState } from 'react';
import { C, MONO, SANS } from '@/lib/constants';

/**
 * Persistent mobile "view menu" bar.
 *
 * The menu is the point of this site, and on a phone it sits a full viewport
 * below the hero. This keeps it one tap away without stealing space on desktop,
 * where the nav is already visible.
 *
 * It appears only after the hero has scrolled past, so it never covers the
 * hero's own primary call to action.
 */
export default function StickyMenuCta({ count = 0 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    if (!mq.matches) return;

    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.75;
      const atMenu = document.getElementById('menu');
      const inMenu = atMenu
        ? atMenu.getBoundingClientRect().top < window.innerHeight * 0.5
        : false;
      setShow(past && !inMenu);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <a
      href="#menu"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        // Clear the iOS home indicator.
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 56,
        padding: '0 22px',
        borderRadius: 3,
        background: C.green,
        color: '#f4faf5',
        boxShadow: '0 10px 30px rgba(0,0,0,.5)',
        animation: 'ccIn .22s ease'
      }}
    >
      <span
        style={{
          font: '600 12px/1 ' + SANS,
          letterSpacing: '.24em',
          textTransform: 'uppercase'
        }}
      >
        View menu
      </span>
      <span
        style={{
          font: '400 10px/1 ' + MONO,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.75)'
        }}
      >
        {count} available
      </span>
    </a>
  );
}

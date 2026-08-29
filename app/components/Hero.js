'use client';

import { useEffect, useRef, useState } from 'react';
import {
  C,
  DISPLAY,
  HERO_LANDSCAPE,
  HERO_POSTER_LANDSCAPE,
  HERO_POSTER_VERTICAL,
  HERO_VERTICAL,
  MONO,
  SANS
} from '@/lib/constants';

export default function Hero() {
  const [portrait, setPortrait] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const size = window.matchMedia('(max-width: 760px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Honour Save-Data where the browser reports it: a looping hero video is
    // the single most expensive thing on this page.
    const saveData = navigator.connection?.saveData === true;

    const apply = () => {
      setPortrait(size.matches);
      setStillOnly(motion.matches || saveData);
    };

    apply();
    size.addEventListener('change', apply);
    motion.addEventListener('change', apply);
    return () => {
      size.removeEventListener('change', apply);
      motion.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || stillOnly) return;
    // Some browsers reject autoplay; ignore the rejection rather than log it.
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [portrait, stillOnly]);

  const poster = portrait ? HERO_POSTER_VERTICAL : HERO_POSTER_LANDSCAPE;
  const mediaBackground =
    'radial-gradient(circle at 50% 35%, rgba(73,178,125,.24), transparent 32%), ' +
    'linear-gradient(180deg,#0b2417 0%,#07140d 55%,#050a07 100%)';

  return (
    <section
      style={{
        position: 'relative',
        // svh, not vh: on iOS Safari 100vh includes the URL bar, so the hero
        // grew taller than the viewport and the CTA sat below the fold.
        height: '100svh',
        minHeight: 620,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end'
      }}
    >
      {mediaFailed ? (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, background: mediaBackground }}
        />
      ) : stillOnly ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          onError={() => setMediaFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: .62,
            filter: 'saturate(.75) contrast(1.05)',
            background: '#081109'
          }}
        />
      ) : (
      <video
        ref={videoRef}
        key={portrait ? 'v' : 'h'}
        src={portrait ? HERO_VERTICAL : HERO_LANDSCAPE}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        // 'auto' told the browser to pull the whole file before anything else
        // could load. 'metadata' plus a poster frame paints immediately and
        // streams the video behind it.
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        onError={() => setMediaFailed(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: .62,
          filter: 'saturate(.75) contrast(1.05)',
          background: '#081109'
        }}
      />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg,#050a07cc 0%,#050a0755 40%,#050a07f2 100%)'
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 24px 130px'
        }}
      >
        <div
          style={{
            font: '400 10px/1 ' + MONO,
            letterSpacing: '.4em',
            color: C.accent,
            textTransform: 'uppercase'
          }}
        >
          Small-batch · California
        </div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(44px,10.5vw,148px)',
            lineHeight: .86,
            letterSpacing: '-.035em',
            margin: '20px 0 0',
            textTransform: 'uppercase',
            textWrap: 'balance',
            maxWidth: '14ch'
          }}
        >
          Cultivated differently.
        </h1>
        <p
          style={{
            font: '300 clamp(14px,1.5vw,17px)/1.6 ' + SANS,
            color: 'rgba(234,240,234,.62)',
            margin: '24px 0 0',
            maxWidth: '44ch'
          }}
        >
          Small-batch California flower, selected by phenotype and released by
          the batch. The menu below is what exists right now.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 38, flexWrap: 'wrap' }}>
          <a
            href="#menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 54,
              padding: '0 32px',
              background: C.green,
              color: '#f4faf5',
              font: '600 12px/1 ' + SANS,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              borderRadius: 2
            }}
          >
            View current menu
          </a>
          <a
            href="#drops"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 54,
              padding: '0 32px',
              border: '1px solid rgba(234,240,234,.24)',
              font: '600 12px/1 ' + SANS,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              borderRadius: 2,
              color: 'rgba(234,240,234,.8)'
            }}
          >
            Latest drop
          </a>
        </div>
      </div>
    </section>
  );
}

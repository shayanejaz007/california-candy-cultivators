'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, DISPLAY, SANS } from '@/lib/constants';
import { AGE_COOKIE, AGE_MAX_AGE } from '@/lib/age';

/**
 * Full-screen age gate with a cinematic reveal into the site.
 *
 * The site is already rendered underneath the overlay. On acceptance we keep
 * the gate mounted long enough for the two curtain layers to peel away while
 * the page underneath sharpens and settles into place. The cookie is written
 * immediately so a refresh during the transition does not show the gate again.
 */
export default function AgeGate({ limit = 21, verified = false }) {
  const [state, setState] = useState(verified ? 'passed' : 'open');
  const panelRef = useRef(null);
  const firstButtonRef = useRef(null);
  const timerRef = useRef(null);

  const accept = useCallback(() => {
    if (state !== 'open') return;

    document.cookie =
      AGE_COOKIE + '=1; path=/; max-age=' + AGE_MAX_AGE + '; samesite=lax' +
      (window.location.protocol === 'https:' ? '; secure' : '');

    // With reduced motion the curtains and the reveal are suppressed in CSS,
    // so holding the overlay for the full cinematic beat left those users
    // staring at a frozen, unscrollable page for over a second. Match the
    // timer to what is actually animating.
    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    document.body.classList.add('cc-site-revealing');
    setState('leaving');

    timerRef.current = window.setTimeout(() => {
      setState('passed');
      document.body.classList.remove('cc-site-revealing');

      // Park focus on the main region rather than letting the browser fall
      // through to the first focusable element. Without this, focus landed on
      // the skip link and a screen-reader user was dropped somewhere arbitrary.
      const main = document.getElementById('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
        main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
      }
    }, reduced ? 60 : 1180);
  }, [state]);

  useEffect(() => {
    const locked = state === 'open' || state === 'leaving' || state === 'exited';
    document.body.style.overflow = locked ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [state]);

  useEffect(() => {
    if (state !== 'open') return;
    firstButtonRef.current?.focus();

    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll('button, [href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    document.body.classList.remove('cc-site-revealing');
  }, []);

  if (state === 'passed') return null;

  const exited = state === 'exited';
  const leaving = state === 'leaving';

  const button = {
    minHeight: 54,
    padding: '0 32px',
    borderRadius: 999,
    font: '600 11px/1 ' + SANS,
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    transition: 'transform .25s ease, border-color .25s ease, background .25s ease'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cc-age-heading"
      aria-busy={leaving ? 'true' : undefined}
      className={'cc-age-gate' + (leaving ? ' cc-age-gate--leaving' : '')}
    >
      <div className="cc-age-ambient" aria-hidden="true" />
      <div className="cc-age-curtain cc-age-curtain--left" aria-hidden="true" />
      <div className="cc-age-curtain cc-age-curtain--right" aria-hidden="true" />
      <div className="cc-age-seam" aria-hidden="true" />

      {exited ? (
        <div className="cc-age-exit">
          <Image
            src="/brand/ccc-mark.png"
            width={770}
            height={770}
            alt=""
            aria-hidden="true"
            className="cc-age-exit-mark"
          />
          <h2
            id="cc-age-heading"
            style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(24px,4vw,38px)',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-.01em'
            }}
          >
            Come back another time.
          </h2>
          <p style={{ font: '300 14px/1.6 ' + SANS, color: C.dim, marginTop: 14 }}>
            You must be of legal age to enter.
          </p>
        </div>
      ) : (
        <div ref={panelRef} className="cc-age-panel">
          <Image
            src="/brand/ccc-logo.png"
            width={896}
            height={1200}
            alt="California Candy Cultivators"
            priority
            className="cc-age-logo"
          />

          <h1 id="cc-age-heading" className="cc-age-heading">
            Are you {limit} or older?
          </h1>

          <p className="cc-age-copy">
            Confirm your age to enter California Candy Cultivators.
          </p>

          <div className="cc-age-actions">
            <button
              ref={firstButtonRef}
              onClick={accept}
              disabled={leaving}
              className="cc-age-enter"
              style={{ ...button }}
            >
              I am over {limit}
            </button>
            <button
              onClick={() => setState('exited')}
              disabled={leaving}
              className="cc-age-exit-button"
              style={{ ...button }}
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

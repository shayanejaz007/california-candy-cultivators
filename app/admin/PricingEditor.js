'use client';

import { useRef } from 'react';
import { C, MONO, SANS } from '@/lib/constants';

/**
 * Structured pricing editor.
 *
 * This replaces a free-text "label | price" textarea. That textarea worked, but
 * it put the burden of formatting on the owner: a stray pipe, a missing one, or
 * a line break in the wrong place silently produced a broken tier. It was also
 * painful on a phone, where this menu is most often updated.
 *
 * Prices stay strings on purpose. The business quotes in whatever form the
 * situation calls for — "$45", "Call", "MKT", "$2,800/lb" — and forcing a
 * numeric field would make half of those unrepresentable.
 */

// Common tiers for this business, so the usual menu is a few taps rather than
// a lot of typing on a phone keyboard.
const PRESETS = ['Gram', 'Eighth', 'Quarter', 'Half oz', 'Ounce', 'QP', 'Half lb', 'Pound'];

export default function PricingEditor({ value = [], onChange, disabled = false }) {
  const rows = Array.isArray(value) ? value : [];
  const lastInputRef = useRef(null);

  const label = {
    font: '600 9.5px/1 ' + SANS,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'rgba(234,240,234,.55)'
  };

  const field = {
    width: '100%',
    minHeight: 46,
    padding: '0 12px',
    background: '#0a130d',
    border: '1px solid rgba(234,240,234,.16)',
    borderRadius: 2,
    color: C.text,
    // 16px minimum: iOS Safari zooms the whole page when a focused input is
    // smaller than that, which on this dark admin looks like a layout bug.
    font: '400 16px/1 ' + SANS
  };

  const update = (i, patch) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const add = (presetLabel = '') => {
    onChange([...rows, { label: presetLabel, price: '' }]);
    // Focus the new price field so a preset tap flows straight into typing.
    requestAnimationFrame(() => lastInputRef.current?.focus());
  };

  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const iconButton = {
    minWidth: 44,
    minHeight: 44,
    border: '1px solid rgba(234,240,234,.14)',
    background: 'transparent',
    borderRadius: 2,
    color: C.dim,
    font: '400 13px/1 ' + SANS,
    cursor: 'pointer'
  };

  return (
    <div>
      <span style={{ ...label, display: 'block' }}>Pricing tiers</span>

      <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        {rows.length === 0 ? (
          <p
            style={{
              font: '400 11px/1.6 ' + MONO,
              letterSpacing: '.1em',
              color: 'rgba(234,240,234,.45)',
              margin: 0
            }}
          >
            No pricing shown yet — the menu will read “Inquire for pricing”.
          </p>
        ) : null}

        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              // Stacks on narrow admin panels, sits inline once there is room.
              gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) auto',
              gap: 8,
              alignItems: 'center',
              padding: 8,
              border: '1px solid rgba(234,240,234,.08)',
              background: 'rgba(234,240,234,.02)',
              borderRadius: 3
            }}
          >
            <input
              value={row.label ?? ''}
              disabled={disabled}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Eighth"
              aria-label={'Tier ' + (i + 1) + ' name'}
              style={field}
            />
            <input
              ref={i === rows.length - 1 ? lastInputRef : null}
              value={row.price ?? ''}
              disabled={disabled}
              onChange={(e) => update(i, { price: e.target.value })}
              placeholder="$45"
              aria-label={'Tier ' + (i + 1) + ' price'}
              style={{ ...field, fontFamily: MONO, letterSpacing: '.04em' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={disabled || i === 0}
                aria-label={'Move tier ' + (i + 1) + ' up'}
                style={{ ...iconButton, opacity: i === 0 ? .3 : 1 }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={disabled || i === rows.length - 1}
                aria-label={'Move tier ' + (i + 1) + ' down'}
                style={{ ...iconButton, opacity: i === rows.length - 1 ? .3 : 1 }}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={'Remove tier ' + (i + 1)}
                style={{ ...iconButton, borderColor: 'rgba(198,139,60,.3)', color: C.amber }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {PRESETS.filter(
          (p) => !rows.some((r) => (r.label || '').toLowerCase() === p.toLowerCase())
        ).map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => add(p)}
            style={{
              minHeight: 36,
              padding: '0 12px',
              border: '1px dashed rgba(234,240,234,.2)',
              background: 'transparent',
              borderRadius: 999,
              color: 'rgba(234,240,234,.6)',
              font: '600 9.5px/1 ' + SANS,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            + {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => add('')}
        style={{
          width: '100%',
          minHeight: 46,
          marginTop: 10,
          border: '1px solid rgba(234,240,234,.18)',
          background: 'transparent',
          borderRadius: 2,
          color: C.accent,
          font: '600 10px/1 ' + SANS,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          cursor: 'pointer'
        }}
      >
        + Add custom tier
      </button>
    </div>
  );
}

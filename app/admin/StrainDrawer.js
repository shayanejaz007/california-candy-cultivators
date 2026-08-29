'use client';

import { useEffect, useState } from 'react';
import PricingEditor from './PricingEditor';
import { C, DISPLAY, MONO, SANS, STATUSES, STATUS_COLOR } from '@/lib/constants';

const BLANK = {
  name: '',
  parentA: '',
  parentB: '',
  flavor: [],
  status: 'COMING SOON',
  qty: 0,
  visible: true,
  featured: false,
  batchName: '',
  batchNo: '',
  harvest: '',
  release: '',
  teaser: '',
  aroma: '',
  appearance: '',
  cultivation: '',
  description: '',
  pricing: [],
  media: []
};

const FIELDS = [
  ['name', 'Strain name', 'Gelato 41'],
  ['parentA', 'Parent A', 'Sunset Sherbet'],
  ['parentB', 'Parent B', 'Thin Mint GSC'],
  ['batchName', 'Batch', 'Candy Room 04'],
  ['batchNo', 'Batch number', 'CCC-G41-0426'],
  ['harvest', 'Harvest', 'Apr 2026'],
  ['qty', 'Units in stock', '0'],
  ['aroma', 'Aroma', 'Sherbet, cold cream, faint diesel'],
  ['appearance', 'Appearance', 'Dense, purple-shot, heavy frost'],
  ['cultivation', 'Cultivation', 'Indoor, 9-week flower, hand-trimmed']
];

export default function StrainDrawer({ strain, onClose, onSave, onDelete, onUploadMedia, onDeleteMedia, onSetCoverMedia }) {
  const isNew = !strain;
  const [draft, setDraft] = useState(() => ({ ...BLANK, ...(strain || {}) }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const field = {
    width: '100%',
    minHeight: 46,
    marginTop: 8,
    background: C.bg,
    border: '1px solid rgba(234,240,234,.14)',
    borderRadius: 2,
    color: C.text,
    padding: '0 13px',
    font: '400 13px/1 ' + SANS,
    outline: 'none'
  };
  const label = {
    font: '400 9px/1 ' + MONO,
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: 'rgba(234,240,234,.38)'
  };

  function submit(e) {
    e.preventDefault();
    if (!String(draft.name).trim()) return;
    const flavor = Array.isArray(draft.flavor)
      ? draft.flavor
      : String(draft.flavor).split(',').map((x) => x.trim()).filter(Boolean);
    onSave({ ...draft, flavor }, isNew);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'New strain' : 'Edit ' + draft.name}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        justifyContent: 'flex-end',
        background: '#020403cc'
      }}
    >
      <div onMouseDown={onClose} style={{ position: 'absolute', inset: 0 }} />
      <form
        onSubmit={submit}
        style={{
          position: 'relative',
          width: 'min(560px,100%)',
          height: '100%',
          overflow: 'auto',
          background: C.panel,
          borderLeft: '1px solid rgba(234,240,234,.14)',
          padding: '26px clamp(20px,3vw,32px) 60px',
          animation: 'ccSlide .28s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ ...label, letterSpacing: '.3em', color: C.accent }}>
              {isNew ? 'New strain' : 'Edit strain'}
            </div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 'clamp(24px,3vw,32px)',
                lineHeight: 1,
                letterSpacing: '-.02em',
                margin: '14px 0 0',
                textTransform: 'uppercase'
              }}
            >
              {draft.name || 'Untitled'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 40,
              height: 40,
              flex: 'none',
              border: '1px solid rgba(234,240,234,.16)',
              background: 'transparent',
              color: C.dim,
              borderRadius: 2,
              font: '400 15px/1 ' + SANS
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14, marginTop: 26 }}>
          {FIELDS.map(([key, text, placeholderText]) => (
            <label key={key}>
              <span style={{ ...label, display: 'block' }}>{text}</span>
              <input
                value={draft[key] ?? ''}
                onChange={set(key)}
                placeholder={placeholderText}
                inputMode={key === 'qty' ? 'numeric' : undefined}
                style={field}
              />
            </label>
          ))}

          <label>
            <span style={{ ...label, display: 'block' }}>Flavor notes (comma separated)</span>
            <input
              value={Array.isArray(draft.flavor) ? draft.flavor.join(', ') : draft.flavor}
              onChange={(e) => setDraft((d) => ({ ...d, flavor: e.target.value }))}
              placeholder="Sweet, Creamy, Gas"
              style={field}
            />
          </label>

          <PricingEditor
            value={draft.pricing || []}
            onChange={(pricing) => setDraft((d) => ({ ...d, pricing }))}
          />

          <div style={{ borderTop: '1px solid rgba(234,240,234,.12)', paddingTop: 18 }}>
            <span style={{ ...label, display: 'block' }}>Strain media</span>
            {isNew ? (
              <div style={{ marginTop: 10, color: C.dim, font: '400 11px/1.6 ' + SANS }}>Save the strain first, then reopen it to upload photos or videos.</div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  disabled={mediaBusy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setMediaBusy(true); setMediaError('');
                    const saved = await onUploadMedia?.(draft.slug, file);
                    if (saved) setDraft((d) => ({ ...d, media: [...(d.media || []), saved] })); else setMediaError('Upload failed.');
                    setMediaBusy(false); e.target.value = '';
                  }}
                  style={{ ...field, padding: 11 }}
                />
                {mediaError ? <div style={{ color: C.amber, marginTop: 8, font: '400 10px/1.4 ' + MONO }}>{mediaError}</div> : null}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
                  {(draft.media || []).map((m) => (
                    <div key={m.id} style={{ border: '1px solid rgba(234,240,234,.12)', padding: 8 }}>
                      {m.type === 'video' ? <video src={m.url} muted playsInline controls style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} /> : <img src={m.url} alt={m.alt || draft.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
                      <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                        <button type="button" onClick={async () => { await onSetCoverMedia?.(draft.slug, m.id); setDraft((d) => ({ ...d, media: (d.media || []).map((x) => ({ ...x, isCover: x.id === m.id })) })); }} style={{ flex: 1, minHeight: 44, border: '1px solid rgba(234,240,234,.15)', background: m.isCover ? '#132a1d' : 'transparent', color: m.isCover ? C.accent : C.dim, font: '600 8px/1 ' + SANS }}>{m.isCover ? 'COVER' : 'MAKE COVER'}</button>
                        <button type="button" onClick={async () => { if (await onDeleteMedia?.(draft.slug, m.id)) setDraft((d) => ({ ...d, media: (d.media || []).filter((x) => x.id !== m.id) })); }} style={{ minHeight: 44, padding: '0 14px', border: '1px solid rgba(198,139,60,.35)', background: 'transparent', color: C.amber, font: '600 8px/1 ' + SANS }}>REMOVE</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <span style={{ ...label, display: 'block' }}>Availability</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 10 }}>
              {STATUSES.map((s) => {
                const on = draft.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        status: s,
                        qty: s === 'SOLD OUT' || s === 'COMING SOON' ? 0 : d.qty
                      }))
                    }
                    aria-pressed={on}
                    style={{
                      minHeight: 44,
                      border: '1px solid ' + (on ? STATUS_COLOR[s] : 'rgba(234,240,234,.16)'),
                      background: on ? '#132a1d' : 'transparent',
                      color: on ? STATUS_COLOR[s] : C.dim,
                      font: '600 9.5px/1 ' + SANS,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                      borderRadius: 2
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {draft.status === 'COMING SOON' ? (
            <div style={{ padding: '14px 16px', border: '1px solid rgba(198,139,60,.35)', background: '#140f07' }}>
              <div
                style={{
                  font: '600 9px/1 ' + SANS,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: C.amber
                }}
              >
                Shows in Coming soon
              </div>
              <div style={{ ...label, marginTop: 9, letterSpacing: '.12em', lineHeight: 1.7 }}>
                Hidden from the live menu. Stock is cleared. Add a release date and teaser below.
              </div>
              <label style={{ display: 'block', marginTop: 12 }}>
                <span style={{ ...label, display: 'block' }}>Expected release</span>
                <input value={draft.release ?? ''} onChange={set('release')} placeholder="June 2026" style={field} />
              </label>
              <label style={{ display: 'block', marginTop: 10 }}>
                <span style={{ ...label, display: 'block' }}>Teaser copy</span>
                <textarea
                  value={draft.teaser ?? ''}
                  onChange={set('teaser')}
                  rows={2}
                  style={{ ...field, minHeight: 0, padding: '11px 13px', lineHeight: 1.6, resize: 'vertical' }}
                />
              </label>
            </div>
          ) : null}

          <label>
            <span style={{ ...label, display: 'block' }}>Description</span>
            <textarea
              value={draft.description ?? ''}
              onChange={set('description')}
              rows={4}
              style={{ ...field, minHeight: 0, padding: '12px 13px', lineHeight: 1.65, resize: 'vertical' }}
            />
          </label>

        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="submit"
            style={{
              minHeight: 50,
              padding: '0 28px',
              border: 0,
              background: C.green,
              color: '#f4faf5',
              font: '600 11px/1 ' + SANS,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              borderRadius: 2
            }}
          >
            {isNew ? 'Create strain' : 'Save strain'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 50,
              padding: '0 24px',
              border: '1px solid rgba(234,240,234,.2)',
              background: 'transparent',
              color: 'rgba(234,240,234,.8)',
              font: '600 11px/1 ' + SANS,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              borderRadius: 2
            }}
          >
            Cancel
          </button>
          {!isNew ? (
            <button
              type="button"
              onClick={() => (confirmDelete ? onDelete(draft.slug) : setConfirmDelete(true))}
              style={{
                minHeight: 50,
                padding: '0 20px',
                marginLeft: 'auto',
                border: '1px solid rgba(198,139,60,.4)',
                background: confirmDelete ? '#241a0c' : 'transparent',
                color: C.amber,
                font: '600 11px/1 ' + SANS,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

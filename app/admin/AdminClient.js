'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { C, DISPLAY, MONO, SANS, STATUS_COLOR, STATUSES, formatDate } from '@/lib/constants';

// Read as full literals so Next can inline them into the client bundle.
const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
import StrainDrawer from './StrainDrawer';

const TABS = [
  ['overview', 'Dashboard'],
  ['inventory', 'Inventory'],
  ['menu', 'Menu'],
  ['drops', 'Coming soon'],
  ['inquiries', 'Inquiries']
];

const TITLES = {
  overview: ['Dashboard', 'Today'],
  inventory: ['Inventory', 'Stock & availability'],
  menu: ['Menu', 'What the public sees'],
  drops: ['Coming soon', 'Upcoming drops'],
  inquiries: ['Inquiries', 'Incoming']
};

export default function AdminClient({ initialStrains, initialInquiries, dataDriver }) {
  const router = useRouter();
  const [strains, setStrains] = useState(initialStrains);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | strain | 'new'
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = useCallback((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? '' : t)), 2600);
  }, []);

  /** Single place where every mutation goes through the API. */
  const call = useCallback(
    async (url, options = {}) => {
      setBusy(true);
      setError('');
      try {
        const res = await fetch(url, {
          headers: options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
          ...options
        });
        if (res.status === 401) {
          router.replace('/login');
          return null;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Request failed (' + res.status + ')');
        }
        return res.status === 204 ? true : await res.json();
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  const patchStrain = useCallback(
    async (slug, patch, message) => {
      const prev = strains;
      // Optimistic: reflect the change immediately, roll back on failure.
      setStrains((list) => list.map((s) => (s.slug === slug ? { ...s, ...patch } : s)));
      const saved = await call('/api/strains/' + slug, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      if (!saved) {
        setStrains(prev);
        return;
      }
      setStrains((list) => list.map((s) => (s.slug === slug ? saved : s)));
      if (patch.featured) {
        setStrains((list) =>
          list.map((s) => (s.slug === slug ? s : { ...s, featured: false }))
        );
      }
      if (message) flash(message);
      router.refresh();
    },
    [call, flash, router, strains]
  );

  const soon = useMemo(() => strains.filter((s) => s.status === 'COMING SOON'), [strains]);
  const live = useMemo(
    () => strains.filter((s) => s.visible && s.status !== 'COMING SOON'),
    [strains]
  );
  const hidden = useMemo(() => strains.filter((s) => !s.visible), [strains]);
  const lowOrOut = useMemo(
    () => strains.filter((s) => s.status === 'LOW STOCK' || s.status === 'SOLD OUT'),
    [strains]
  );
  const newInq = useMemo(() => inquiries.filter((i) => i.status === 'NEW'), [inquiries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return strains.filter((s) => {
      if (filter !== 'ALL' && s.status !== filter) return false;
      if (!q) return true;
      return [s.name, s.parentA, s.parentB, s.batchNo].join(' ').toLowerCase().includes(q);
    });
  }, [strains, filter, query]);

  const [kicker, title] = TITLES[tab] ? [TITLES[tab][1], TITLES[tab][0]] : ['', ''];

  const mono = (size, alpha) => ({
    font: '400 ' + size + 'px/1.5 ' + MONO,
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: 'rgba(234,240,234,' + alpha + ')'
  });

  const cell = { background: C.panel, padding: '22px 20px', boxShadow: 'inset -1px -1px 0 rgba(234,240,234,.1)' };
  const gridRow = {
    display: 'grid',
    gridTemplateColumns: '2fr 1.6fr 132px 122px 150px 1fr 96px',
    gap: 14,
    padding: '14px 20px',
    alignItems: 'center'
  };

  async function saveStrain(draft, isNew) {
    if (isNew) {
      const created = await call('/api/strains', {
        method: 'POST',
        body: JSON.stringify(draft)
      });
      if (!created) return;
      setStrains((list) => [...list, created]);
      flash('Strain created');
    } else {
      const saved = await call('/api/strains/' + draft.slug, {
        method: 'PATCH',
        body: JSON.stringify(draft)
      });
      if (!saved) return;
      setStrains((list) => list.map((s) => (s.slug === saved.slug ? saved : s)));
      flash('Strain saved');
    }
    setEditing(null);
    router.refresh();
  }

  async function removeStrain(slug) {
    const ok = await call('/api/strains/' + slug, { method: 'DELETE' });
    if (!ok) return;
    setStrains((list) => list.filter((s) => s.slug !== slug));
    setEditing(null);
    flash('Strain deleted');
    router.refresh();
  }

  async function move(slug, dir) {
    const ordered = [...live];
    const i = ordered.findIndex((s) => s.slug === slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const slugs = ordered.map((s) => s.slug);
    setStrains((list) =>
      [...list].sort((a, b) => {
        const ai = slugs.indexOf(a.slug);
        const bi = slugs.indexOf(b.slug);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    );
    await call('/api/strains/reorder', { method: 'POST', body: JSON.stringify({ slugs }) });
    router.refresh();
  }

  async function cycleInquiry(inq) {
    const next = inq.status === 'NEW' ? 'REPLIED' : inq.status === 'REPLIED' ? 'CLOSED' : 'NEW';
    const prev = inquiries;
    setInquiries((list) => list.map((i) => (i.id === inq.id ? { ...i, status: next } : i)));
    const saved = await call('/api/inquiries/' + inq.id, {
      method: 'PATCH',
      body: JSON.stringify({ status: next })
    });
    if (!saved) setInquiries(prev);
  }


  async function uploadMedia(slug, file) {
    let saved = null;
    if (dataDriver === 'supabase') {
      const signed = await call('/api/strains/' + slug + '/media/sign', {
        method: 'POST', body: JSON.stringify({ type: file.type, size: file.size, name: file.name })
      });
      if (!signed) return null;
      const { createClient } = await import('@supabase/supabase-js');
      const url = SUPABASE_PUBLIC_URL;
      const key = SUPABASE_PUBLIC_KEY;
      if (!url || !key) {
        setError('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to upload media.');
        return null;
      }
      const browser = createClient(url, key);
      const uploaded = await browser.storage.from('strain-media').uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (uploaded.error) { setError(uploaded.error.message || 'Upload failed'); return null; }
      saved = await call('/api/strains/' + slug + '/media/complete', {
        method: 'POST', body: JSON.stringify({ path: signed.path, type: file.type, alt: slug })
      });
    } else {
      const body = new FormData();
      body.append('file', file);
      saved = await call('/api/strains/' + slug + '/media', { method: 'POST', body });
    }
    if (!saved) return null;
    setStrains((list) => list.map((x) => x.slug === slug ? { ...x, media: [...(x.media || []), saved] } : x));
    setEditing((x) => x && x !== 'new' && x.slug === slug ? { ...x, media: [...(x.media || []), saved] } : x);
    flash('Media uploaded');
    return saved;
  }

  async function deleteMedia(slug, id) {
    const ok = await call('/api/strains/' + slug + '/media', { method: 'DELETE', body: JSON.stringify({ id }) });
    if (!ok) return false;
    setStrains((list) => list.map((x) => x.slug === slug ? { ...x, media: (x.media || []).filter((m) => m.id !== id) } : x));
    setEditing((x) => x && x !== 'new' && x.slug === slug ? { ...x, media: (x.media || []).filter((m) => m.id !== id) } : x);
    flash('Media removed');
    return true;
  }

  async function setCoverMedia(slug, id) {
    const ok = await call('/api/strains/' + slug + '/media', { method: 'PATCH', body: JSON.stringify({ id, action: 'cover' }) });
    if (!ok) return false;
    const mark = (x) => ({ ...x, media: (x.media || []).map((m) => ({ ...m, isCover: m.id === id })) });
    setStrains((list) => list.map((x) => x.slug === slug ? mark(x) : x));
    setEditing((x) => x && x !== 'new' && x.slug === slug ? mark(x) : x);
    flash('Cover media updated');
    return true;
  }

  async function signOut() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  }

  const stats = [
    ['On menu', live.length, 'Visible now', C.text],
    ['Units in stock', strains.reduce((n, s) => n + (s.qty || 0), 0), 'Across all batches', C.text],
    ['Low or out', lowOrOut.length, 'Needs a decision', lowOrOut.length ? C.amber : C.text],
    ['Coming soon', soon.length, 'In the drops queue', soon.length ? C.amber : C.text],
    ['New inquiries', newInq.length, 'Unanswered', newInq.length ? C.accent : C.text]
  ];

  return (
    <div className="cc-admin-shell">
      <aside className="cc-admin-aside">
        <div className="cc-admin-brand" style={{ padding: '0 20px' }}>
          <div style={{ ...mono(9.5, .85), letterSpacing: '.28em', lineHeight: 1.5 }}>
            California<br />Candy<br />Cultivators
          </div>
          <div
            style={{
              font: '600 8.5px/1 ' + SANS,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: C.accent,
              marginTop: 12
            }}
          >
            Admin
          </div>
        </div>

        <nav className="cc-admin-nav">
          {TABS.map(([key, label]) => {
            const on = tab === key;
            const badge =
              key === 'inventory' ? strains.length
                : key === 'menu' ? live.length
                  : key === 'drops' ? soon.length
                    : key === 'inquiries' ? newInq.length
                      : '';
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={on ? 'page' : undefined}
                className="cc-admin-tab"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  minHeight: 44,
                  padding: '0 12px',
                  border: 0,
                  borderRadius: 2,
                  background: on ? '#132a1d' : 'transparent',
                  color: on ? '#dff0e5' : C.dim,
                  font: '600 10.5px/1 ' + SANS,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  textAlign: 'left'
                }}
              >
                <span>{label}</span>
                <span style={{ font: '400 9.5px/1 ' + MONO, color: on ? C.accent : 'rgba(234,240,234,.3)' }}>
                  {badge}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="cc-admin-foot" style={{ marginTop: 'auto', padding: '0 20px' }}>
          <div style={{ borderTop: '1px solid ' + C.line, paddingTop: 16, display: 'grid', gap: 12 }}>
            <Link href="/" style={{ font: '600 9.5px/1 ' + SANS, letterSpacing: '.2em', textTransform: 'uppercase', color: C.accent }}>
              View public site →
            </Link>
            <button
              onClick={signOut}
              style={{
                minHeight: 44,
                border: '1px solid rgba(234,240,234,.16)',
                background: 'transparent',
                color: C.dim,
                font: '600 9px/1 ' + SANS,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main style={{ minWidth: 0, padding: '26px clamp(18px,2.6vw,34px) 90px' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            borderBottom: '1px solid ' + C.line,
            paddingBottom: 20
          }}
        >
          <div>
            <div style={{ ...mono(9.5, 1), letterSpacing: '.3em', color: C.accent }}>{kicker}</div>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: 'clamp(26px,3.4vw,40px)',
                lineHeight: .95,
                letterSpacing: '-.025em',
                margin: '14px 0 0',
                textTransform: 'uppercase'
              }}
            >
              {title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={mono(9.5, busy ? .6 : .3)}>{busy ? 'Saving…' : 'Saved to database'}</span>
            <button
              onClick={() => setEditing('new')}
              style={{
                minHeight: 44,
                padding: '0 22px',
                border: '1px solid rgba(234,240,234,.2)',
                borderRadius: 2,
                background: 'transparent',
                color: C.text,
                font: '600 10.5px/1 ' + SANS,
                letterSpacing: '.2em',
                textTransform: 'uppercase'
              }}
            >
              + New strain
            </button>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: '13px 16px',
              border: '1px solid rgba(198,139,60,.5)',
              background: '#140f07',
              font: '600 10px/1.5 ' + SANS,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: C.amber
            }}
          >
            {error}
          </div>
        ) : null}

        {toast ? (
          <div
            style={{
              marginTop: 16,
              padding: '13px 16px',
              border: '1px solid rgba(127,180,149,.4)',
              background: '#0d1a12',
              font: '600 10px/1 ' + SANS,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: C.accent,
              animation: 'ccIn .3s ease'
            }}
          >
            {toast}
          </div>
        ) : null}

        {tab === 'overview' ? (
          <section style={{ animation: 'ccIn .3s ease' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))',
                border: '1px solid ' + C.line,
                marginTop: 26
              }}
            >
              {stats.map(([label, value, note, color]) => (
                <div key={label} style={cell}>
                  <div style={mono(9, .38)}>{label}</div>
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 32,
                      lineHeight: 1,
                      letterSpacing: '-.025em',
                      marginTop: 14,
                      color
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ ...mono(9.5, .32), marginTop: 10 }}>{note}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
                gap: 18,
                marginTop: 20
              }}
            >
              <div style={{ border: '1px solid ' + C.line, background: C.panel, padding: 24 }}>
                <div style={{ font: '600 10px/1 ' + SANS, letterSpacing: '.24em', textTransform: 'uppercase', color: C.dim }}>
                  Needs attention
                </div>
                {lowOrOut.length === 0 ? (
                  <div style={{ ...mono(10, .3), padding: '22px 0' }}>Nothing needs attention</div>
                ) : (
                  lowOrOut.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => { setTab('inventory'); setEditing(s); }}
                      style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 0,
                        borderBottom: '1px solid rgba(234,240,234,.08)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', font: '500 13px/1.3 ' + SANS, color: C.text }}>
                          {s.name}
                        </span>
                        <span style={{ ...mono(9.5, .35), display: 'block', marginTop: 6 }}>
                          {s.batchNo} · {s.status === 'SOLD OUT' ? 'no units left' : s.qty + ' units left'}
                        </span>
                      </span>
                      <span
                        style={{
                          flex: 'none',
                          font: '600 9px/1 ' + SANS,
                          letterSpacing: '.2em',
                          textTransform: 'uppercase',
                          padding: '7px 10px',
                          borderRadius: 2,
                          background: s.status === 'SOLD OUT' ? 'rgba(234,240,234,.08)' : '#241a0c',
                          color: STATUS_COLOR[s.status]
                        }}
                      >
                        {s.status}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div style={{ border: '1px solid ' + C.line, background: C.panel, padding: 24 }}>
                <div style={{ font: '600 10px/1 ' + SANS, letterSpacing: '.24em', textTransform: 'uppercase', color: C.dim }}>
                  Recent inquiries
                </div>
                {inquiries.length === 0 ? (
                  <div style={{ ...mono(10, .3), padding: '22px 0' }}>No inquiries yet</div>
                ) : (
                  inquiries.slice(0, 4).map((i) => (
                    <div
                      key={i.id}
                      style={{
                        padding: '15px 0',
                        borderBottom: '1px solid rgba(234,240,234,.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: '500 13px/1.3 ' + SANS }}>{i.name}</div>
                        <div style={{ ...mono(9.5, .35), marginTop: 6 }}>
                          {i.strain} · {formatDate(i.createdAt)}
                        </div>
                      </div>
                      <span
                        style={{
                          flex: 'none',
                          font: '600 9px/1 ' + SANS,
                          letterSpacing: '.2em',
                          textTransform: 'uppercase',
                          color: i.status === 'NEW' ? C.accent : i.status === 'REPLIED' ? C.amber : 'rgba(234,240,234,.35)'
                        }}
                      >
                        {i.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'inventory' ? (
          <section style={{ animation: 'ccIn .3s ease' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                padding: '22px 0'
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['ALL', ...STATUSES].map((f) => {
                  const on = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      aria-pressed={on}
                      style={{
                        minHeight: 38,
                        padding: '0 16px',
                        border: '1px solid ' + (on ? C.greenHi : 'rgba(234,240,234,.16)'),
                        background: on ? C.greenDeep : 'transparent',
                        color: on ? '#dff0e5' : 'rgba(234,240,234,.6)',
                        font: '600 10px/1 ' + SANS,
                        letterSpacing: '.18em',
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
                  minHeight: 38,
                  minWidth: 210,
                  flex: '0 1 280px',
                  background: C.panel,
                  border: '1px solid rgba(234,240,234,.14)',
                  borderRadius: 2,
                  color: C.text,
                  padding: '0 14px',
                  font: '400 12px/1 ' + SANS,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ border: '1px solid ' + C.line, background: C.panel, overflowX: 'auto' }}>
              <div style={{ minWidth: 960 }} role="group" aria-label="Scroll horizontally to see all columns">
                <div
                  style={{
                    ...gridRow,
                    borderBottom: '1px solid rgba(234,240,234,.12)',
                    font: '600 9px/1 ' + SANS,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(234,240,234,.4)'
                  }}
                >
                  <div>Strain</div><div>Genetics</div><div>Availability</div>
                  <div>Qty</div><div>Batch</div><div>Harvest</div>
                  <div style={{ textAlign: 'right' }}>On site</div>
                </div>

                {rows.map((s) => (
                  <div
                    key={s.slug}
                    style={{
                      ...gridRow,
                      borderBottom: '1px solid rgba(234,240,234,.07)',
                      background: s.status === 'COMING SOON' ? '#0b0f08' : 'transparent'
                    }}
                  >
                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: STATUS_COLOR[s.status],
                          flex: 'none'
                        }}
                      />
                      <button
                        onClick={() => setEditing(s)}
                        style={{ border: 0, background: 'transparent', padding: 0, textAlign: 'left', minWidth: 0 }}
                      >
                        <span style={{ display: 'block', font: '600 14px/1.2 ' + SANS, color: C.text }}>
                          {s.name}
                        </span>
                        <span style={{ ...mono(9, .32), display: 'block', marginTop: 5 }}>{s.batchNo}</span>
                      </button>
                    </div>

                    <div style={{ font: '400 11.5px/1.4 ' + SANS, color: C.accent, minWidth: 0 }}>
                      {s.parentA} × {s.parentB}
                    </div>

                    <select
                      value={s.status}
                      onChange={(e) => {
                        const status = e.target.value;
                        patchStrain(
                          s.slug,
                          { status },
                          status === 'COMING SOON' ? 'Moved to the Coming soon section' : ''
                        );
                      }}
                      aria-label={'Availability for ' + s.name}
                      style={{
                        width: '100%',
                        minHeight: 38,
                        background: C.bg,
                        border: '1px solid rgba(234,240,234,.16)',
                        borderRadius: 2,
                        color: STATUS_COLOR[s.status],
                        padding: '0 8px',
                        font: '600 9.5px/1 ' + SANS,
                        letterSpacing: '.12em',
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    >
                      {STATUSES.map((o) => (
                        <option key={o} value={o} style={{ background: C.bg, color: C.text }}>
                          {o}
                        </option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => patchStrain(s.slug, { qty: Math.max(0, (s.qty || 0) - 1) })}
                        aria-label={'Decrease stock for ' + s.name}
                        style={{
                          width: 32, height: 36, flex: 'none',
                          border: '1px solid rgba(234,240,234,.16)',
                          background: 'transparent', color: 'rgba(234,240,234,.7)',
                          borderRadius: 2, font: '400 15px/1 ' + SANS
                        }}
                      >
                        −
                      </button>
                      <input
                        value={s.qty}
                        onChange={(e) => {
                          const n = Number.parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                          setStrains((list) =>
                            list.map((x) => (x.slug === s.slug ? { ...x, qty: Number.isFinite(n) ? n : 0 } : x))
                          );
                        }}
                        onBlur={(e) => {
                          const n = Number.parseInt(e.target.value, 10);
                          patchStrain(s.slug, { qty: Number.isFinite(n) ? Math.max(0, n) : 0 });
                        }}
                        inputMode="numeric"
                        aria-label={'Stock for ' + s.name}
                        style={{
                          width: '100%', minWidth: 0, minHeight: 36,
                          background: C.bg, border: '1px solid rgba(234,240,234,.16)',
                          borderRadius: 2, color: C.text, padding: '0 8px',
                          font: '500 12px/1 ' + MONO, textAlign: 'center', outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => patchStrain(s.slug, { qty: (s.qty || 0) + 1 })}
                        aria-label={'Increase stock for ' + s.name}
                        style={{
                          width: 32, height: 36, flex: 'none',
                          border: '1px solid rgba(234,240,234,.16)',
                          background: 'transparent', color: 'rgba(234,240,234,.7)',
                          borderRadius: 2, font: '400 15px/1 ' + SANS
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ ...mono(10, .5), minWidth: 0 }}>{s.batchName}</div>
                    <div style={mono(10, .5)}>{s.harvest}</div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => patchStrain(s.slug, { visible: !s.visible })}
                        role="switch"
                        aria-checked={s.visible}
                        aria-label={'Show ' + s.name + ' on the site'}
                        style={{
                          width: 52, height: 28,
                          border: '1px solid ' + (s.visible ? C.greenHi : 'rgba(234,240,234,.2)'),
                          background: s.visible ? C.greenDeep : 'transparent',
                          borderRadius: 20, position: 'relative', padding: 0
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 3,
                            left: s.visible ? 26 : 3,
                            width: 20, height: 20, borderRadius: '50%',
                            background: s.visible ? C.accent : 'rgba(234,240,234,.35)',
                            transition: 'left .2s'
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rows.length === 0 ? (
              <div style={{ ...mono(10.5, .32), padding: '56px 0', textAlign: 'center', letterSpacing: '.2em' }}>
                No strains match that filter
              </div>
            ) : null}

            <div style={{ ...mono(9.5, .3), marginTop: 16, lineHeight: 1.7 }}>
              Setting availability to Coming soon clears the stock count, pulls the strain out of
              the live menu, and lists it in the Coming soon section on the public site.
            </div>
          </section>
        ) : null}

        {tab === 'menu' ? (
          <section style={{ animation: 'ccIn .3s ease', marginTop: 26 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
                gap: 18
              }}
            >
              <div style={{ border: '1px solid ' + C.line, background: C.panel, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ font: '600 10px/1 ' + SANS, letterSpacing: '.24em', textTransform: 'uppercase', color: C.dim }}>
                    Live on menu
                  </div>
                  <div style={{ ...mono(9.5, 1), color: C.accent }}>{live.length} live</div>
                </div>
                {live.map((s) => (
                  <div
                    key={s.slug}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '13px 0',
                      borderBottom: '1px solid rgba(234,240,234,.08)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 'none' }}>
                      <button
                        onClick={() => move(s.slug, -1)}
                        aria-label={'Move ' + s.name + ' up'}
                        style={{
                          width: 26, height: 20,
                          border: '1px solid rgba(234,240,234,.14)',
                          background: 'transparent', color: 'rgba(234,240,234,.6)',
                          borderRadius: 2, font: '400 9px/1 ' + SANS
                        }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(s.slug, 1)}
                        aria-label={'Move ' + s.name + ' down'}
                        style={{
                          width: 26, height: 20,
                          border: '1px solid rgba(234,240,234,.14)',
                          background: 'transparent', color: 'rgba(234,240,234,.6)',
                          borderRadius: 2, font: '400 9px/1 ' + SANS
                        }}
                      >
                        ▼
                      </button>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ font: '600 13.5px/1.2 ' + SANS }}>{s.name}</div>
                      <div style={{ ...mono(9, .34), marginTop: 5 }}>{s.status} · {s.qty} units</div>
                    </div>
                    <button
                      onClick={() => patchStrain(s.slug, { featured: !s.featured })}
                      style={{
                        flex: 'none', minHeight: 34, padding: '0 12px',
                        border: '1px solid ' + (s.featured ? C.greenHi : 'rgba(234,240,234,.16)'),
                        background: s.featured ? C.greenDeep : 'transparent',
                        color: s.featured ? '#dff0e5' : C.dim,
                        font: '600 9px/1 ' + SANS, letterSpacing: '.18em',
                        textTransform: 'uppercase', borderRadius: 2
                      }}
                    >
                      {s.featured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      onClick={() => patchStrain(s.slug, { visible: false })}
                      style={{
                        flex: 'none', minHeight: 34, padding: '0 12px',
                        border: '1px solid rgba(234,240,234,.16)',
                        background: 'transparent', color: C.dim,
                        font: '600 9px/1 ' + SANS, letterSpacing: '.18em',
                        textTransform: 'uppercase', borderRadius: 2
                      }}
                    >
                      Hide
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ border: '1px solid ' + C.line, background: C.panel, padding: 24 }}>
                <div style={{ font: '600 10px/1 ' + SANS, letterSpacing: '.24em', textTransform: 'uppercase', color: C.dim }}>
                  Hidden from menu
                </div>
                {hidden.length === 0 ? (
                  <div style={{ ...mono(10, .3), padding: '20px 0' }}>Everything is visible</div>
                ) : (
                  hidden.map((s) => (
                    <div
                      key={s.slug}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '13px 0',
                        borderBottom: '1px solid rgba(234,240,234,.08)'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: '600 13.5px/1.2 ' + SANS, color: 'rgba(234,240,234,.72)' }}>
                          {s.name}
                        </div>
                        <div style={{ ...mono(9, .34), marginTop: 5 }}>
                          {s.status === 'SOLD OUT' ? 'Sold out · hidden' : 'Hidden manually'}
                        </div>
                      </div>
                      <button
                        onClick={() => patchStrain(s.slug, { visible: true })}
                        style={{
                          flex: 'none', minHeight: 34, padding: '0 14px',
                          border: '1px solid rgba(234,240,234,.18)',
                          background: 'transparent', color: 'rgba(234,240,234,.8)',
                          font: '600 9px/1 ' + SANS, letterSpacing: '.18em',
                          textTransform: 'uppercase', borderRadius: 2
                        }}
                      >
                        Show
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'drops' ? (
          <section style={{ animation: 'ccIn .3s ease', marginTop: 26 }}>
            <div style={{ ...mono(9.5, .4), maxWidth: '70ch', lineHeight: 1.7 }}>
              Anything set to Coming soon appears here and in the Coming soon section of the
              public site. Set an expected release and a teaser for each.
            </div>
            {soon.length === 0 ? (
              <div style={{ ...mono(10.5, .32), padding: '64px 0', textAlign: 'center', lineHeight: 1.7 }}>
                Nothing is marked coming soon.<br />
                Set a strain&apos;s availability to Coming soon in Inventory.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))',
                  gap: 18,
                  marginTop: 22
                }}
              >
                {soon.map((s) => (
                  <article
                    key={s.slug}
                    style={{ border: '1px solid rgba(198,139,60,.32)', background: C.panel, padding: 24 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />
                        <span
                          style={{
                            font: '600 9px/1 ' + SANS,
                            letterSpacing: '.22em',
                            textTransform: 'uppercase',
                            color: C.amber
                          }}
                        >
                          Coming soon
                        </span>
                      </div>
                      <button
                        onClick={() => patchStrain(s.slug, { status: 'AVAILABLE', qty: 12 }, s.name + ' released to the live menu')}
                        style={{
                          minHeight: 32, padding: '0 12px',
                          border: '1px solid rgba(234,240,234,.18)',
                          background: 'transparent', color: 'rgba(234,240,234,.7)',
                          font: '600 9px/1 ' + SANS, letterSpacing: '.18em',
                          textTransform: 'uppercase', borderRadius: 2
                        }}
                      >
                        Release now
                      </button>
                    </div>
                    <h3
                      style={{
                        fontFamily: DISPLAY,
                        fontSize: 26,
                        lineHeight: 1,
                        letterSpacing: '-.02em',
                        margin: '16px 0 0',
                        textTransform: 'uppercase'
                      }}
                    >
                      {s.name}
                    </h3>
                    <div style={{ font: '500 11.5px/1.4 ' + SANS, color: C.accent, marginTop: 9 }}>
                      {s.parentA} × {s.parentB}
                    </div>

                    <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                      <label>
                        <span style={{ ...mono(9, .35), display: 'block', letterSpacing: '.2em' }}>
                          Expected release
                        </span>
                        <input
                          defaultValue={s.release}
                          onBlur={(e) => {
                            if (e.target.value !== s.release) patchStrain(s.slug, { release: e.target.value });
                          }}
                          placeholder="e.g. June 2026"
                          style={{
                            width: '100%', minHeight: 42, marginTop: 8,
                            background: C.bg, border: '1px solid rgba(234,240,234,.14)',
                            borderRadius: 2, color: C.text, padding: '0 12px',
                            font: '400 12.5px/1 ' + SANS, outline: 'none'
                          }}
                        />
                      </label>
                      <label>
                        <span style={{ ...mono(9, .35), display: 'block', letterSpacing: '.2em' }}>
                          Teaser copy
                        </span>
                        <textarea
                          defaultValue={s.teaser}
                          onBlur={(e) => {
                            if (e.target.value !== s.teaser) patchStrain(s.slug, { teaser: e.target.value });
                          }}
                          rows={3}
                          placeholder="One or two lines shown on the public site"
                          style={{
                            width: '100%', marginTop: 8,
                            background: C.bg, border: '1px solid rgba(234,240,234,.14)',
                            borderRadius: 2, color: C.text, padding: '11px 12px',
                            font: '400 12.5px/1.6 ' + SANS, outline: 'none', resize: 'vertical'
                          }}
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'inquiries' ? (
          <section style={{ animation: 'ccIn .3s ease', marginTop: 26 }}>
            <div style={{ border: '1px solid ' + C.line, background: C.panel, overflowX: 'auto' }}>
              <div style={{ minWidth: 860 }} role="group" aria-label="Scroll horizontally to see all columns">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.6fr 1.2fr 1fr 150px',
                    gap: 14,
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(234,240,234,.12)',
                    font: '600 9px/1 ' + SANS,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(234,240,234,.4)'
                  }}
                >
                  <div>From</div><div>Contact</div><div>Strain</div><div>Received</div><div>Status</div>
                </div>
                {inquiries.length === 0 ? (
                  <div style={{ ...mono(10, .3), padding: '48px 20px' }}>No inquiries yet</div>
                ) : (
                  inquiries.map((i) => (
                    <div
                      key={i.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1.6fr 1.2fr 1fr 150px',
                        gap: 14,
                        padding: '15px 20px',
                        borderBottom: '1px solid rgba(234,240,234,.07)',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ font: '600 13px/1.3 ' + SANS, minWidth: 0 }}>{i.name}</div>
                      <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                        {/* Phone first: it is the field every inquiry has and
                            the one you actually act on. */}
                        <a
                          href={'tel:' + String(i.phone || '').replace(/[^0-9+]/g, '')}
                          style={{ font: '400 11.5px/1.5 ' + MONO, color: C.text }}
                        >
                          {i.phone}
                        </a>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: '400 11.5px/1.4 ' + SANS, color: C.accent }}>
                          {i.strain}
                        </div>
                      </div>
                      <div style={mono(10, .45)}>{formatDate(i.createdAt)}</div>
                      <button
                        onClick={() => cycleInquiry(i)}
                        style={{
                          width: '100%', minHeight: 36,
                          border: '1px solid ' + (i.status === 'NEW' ? C.greenHi : 'rgba(234,240,234,.16)'),
                          background: i.status === 'NEW' ? '#132a1d' : 'transparent',
                          color: i.status === 'NEW' ? C.accent : i.status === 'REPLIED' ? C.amber : 'rgba(234,240,234,.4)',
                          font: '600 9px/1 ' + SANS, letterSpacing: '.18em',
                          textTransform: 'uppercase', borderRadius: 2
                        }}
                      >
                        {i.status}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {editing ? (
        <StrainDrawer
          strain={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveStrain}
          onDelete={removeStrain}
          onUploadMedia={uploadMedia}
          onDeleteMedia={deleteMedia}
          onSetCoverMedia={setCoverMedia}
        />
      ) : null}
    </div>
  );
}

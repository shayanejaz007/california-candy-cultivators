'use client';

import { useEffect, useState } from 'react';
import { C, DISPLAY, MONO, SANS } from '@/lib/constants';

// `company` is a honeypot: hidden from people, filled in by naive bots. The
// server accepts and silently discards any submission that has it set.
const EMPTY = { name: '', phone: '', message: '', company: '' };

export default function InquiryModal({ strain, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('editing'); // editing | sending | sent
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Your name is required.');
      return;
    }
    if (form.phone.replace(/[^0-9]/g, '').length < 7) {
      setError('A phone number is required so we can reach you.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, strain: strain || 'General inquiry', sourcePage: window.location.pathname })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('editing');
        setError(data.error || 'Could not send that. Please try again.');
        return;
      }
      setStatus('sent');
      setForm(EMPTY);
    } catch {
      setStatus('editing');
      setError('Could not send that. Please try again.');
    }
  }


  const field = {
    minHeight: 50,
    background: C.bg,
    border: '1px solid rgba(234,240,234,.14)',
    borderRadius: 2,
    color: C.text,
    padding: '0 14px',
    font: '400 13px/1 ' + SANS,
    outline: 'none'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Inquiry"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: '#020403e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'ccFade .25s ease'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: C.card,
          border: '1px solid rgba(234,240,234,.14)',
          borderRadius: 3,
          padding: 'clamp(24px,4vw,40px)',
          maxHeight: '92vh',
          overflow: 'auto'
        }}
      >
        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '26px 0' }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 'clamp(26px,4vw,38px)',
                lineHeight: 1,
                textTransform: 'uppercase',
                color: C.accent
              }}
            >
              Inquiry received
            </div>
            <p
              style={{
                font: '300 14px/1.7 ' + SANS,
                color: C.dim,
                margin: '18px auto 0',
                maxWidth: '34ch'
              }}
            >
              We will follow up with current availability and batch details.
            </p>
            <button
              onClick={onClose}
              style={{
                minHeight: 50,
                padding: '0 30px',
                marginTop: 28,
                border: '1px solid rgba(234,240,234,.2)',
                background: 'transparent',
                color: C.text,
                font: '600 11px/1 ' + SANS,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="cc-company">Company</label>
              <input
                id="cc-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={set('company')}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16
              }}
            >
              <div>
                <div
                  style={{
                    font: '400 9.5px/1 ' + MONO,
                    letterSpacing: '.3em',
                    color: C.accent,
                    textTransform: 'uppercase'
                  }}
                >
                  Inquiry
                </div>
                <h3
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 'clamp(24px,3.4vw,32px)',
                    lineHeight: 1,
                    letterSpacing: '-.02em',
                    margin: '14px 0 0',
                    textTransform: 'uppercase'
                  }}
                >
                  {strain ? 'Inquire' : 'General inquiry'}
                </h3>
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

            {strain ? (
              <div
                style={{
                  marginTop: 18,
                  padding: '12px 14px',
                  border: '1px solid rgba(127,180,149,.3)',
                  background: '#0d1a12',
                  font: '400 9.5px/1.6 ' + MONO,
                  letterSpacing: '.14em',
                  color: C.accent,
                  textTransform: 'uppercase'
                }}
              >
                Attached: {strain}
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="Name"
                autoComplete="name"
                required
                style={field}
              />
              <input
                value={form.phone}
                onChange={set('phone')}
                placeholder="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                style={field}
              />
              <textarea
                value={form.message}
                onChange={set('message')}
                placeholder="Notes (optional)"
                rows={3}
                style={{ ...field, minHeight: 0, padding: 14, lineHeight: 1.6, resize: 'vertical' }}
              />
            </div>

            {error ? (
              <div
                role="alert"
                style={{
                  font: '400 10px/1.6 ' + MONO,
                  letterSpacing: '.14em',
                  color: C.amber,
                  textTransform: 'uppercase',
                  marginTop: 12
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                width: '100%',
                minHeight: 54,
                marginTop: 20,
                border: 0,
                background: status === 'sending' ? '#1a2b21' : C.green,
                color: '#f4faf5',
                font: '600 12px/1 ' + SANS,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Send inquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

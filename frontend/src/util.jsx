import { useEffect, useState } from 'react';
import { api } from './api.js';

export const COIN = '◎';
export const displayName = (u) => (u && (u.first_name || u.username)) || '';

// ---------- icons ----------
const PATHS = {
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  search:
    'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  logout:
    'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  history:
    'M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3zm-1 5v5l4.25 2.52.77-1.28L13.5 12V8z',
  close:
    'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
};
export function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

// ---------- avatar ----------
const COLORS = ['#e57373', '#f06292', '#ba68c8', '#7986cb', '#4fc3f7', '#4db6ac', '#81c784', '#ffb74d', '#a1887f', '#90a4ae'];
const colorFor = (s = '') => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export function Avatar({ src, name = '?', size = 49, square = false }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  const style = { width: size, height: size };
  if (src && !bad) {
    return (
      <img
        className={`avatar ${square ? 'sq' : ''}`}
        style={style}
        src={src}
        alt=""
        loading="lazy"
        onError={() => setBad(true)}
      />
    );
  }
  return (
    <div
      className={`avatar ph ${square ? 'sq' : ''}`}
      style={{ ...style, background: colorFor(name), fontSize: size * 0.42 }}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </div>
  );
}

// ---------- dates ----------
const sameDay = (a, b) => a.toDateString() === b.toDateString();
export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function fmtDay(d) {
  const date = new Date(d);
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Today';
  if (sameDay(date, y)) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtRel(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return `today at ${fmtTime(d)}`;
  if (sameDay(date, y)) return `yesterday at ${fmtTime(d)}`;
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// ---------- categories (cached) ----------
let catPromise;
export function useCategories() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    catPromise ??= api('ajax/', { params: { purpose: 'categories' }, auth: false }).then((r) => r.data);
    let off = false;
    catPromise.then((d) => !off && setCats(d)).catch(() => (catPromise = undefined));
    return () => {
      off = true;
    };
  }, []);
  return cats; // [[key, label], ...]
}
export const catLabel = (cats, key) => cats.find((c) => c[0] === key)?.[1] || key;

import en from './i18n-en.js';
import pt from './i18n-pt.js';

export const LANGS = { en, pt };
export const DEFAULT_LANG = 'en';

// Public URL of a page in a language: '/club' (en) or '/pt/club' (pt).
export function url(lang, path = '/') {
  const p = path.startsWith('/') ? path : '/' + path;
  if (lang === DEFAULT_LANG) return p;
  return '/' + lang + (p === '/' ? '/' : p);
}

// 'YYYY-MM-DD' → parts, without time-zone surprises.
export function parseDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

export function longDate(t, iso) {
  const { y, m, d } = parseDate(iso);
  return t.lang === 'pt' ? `${d} de ${t.months[m - 1]} de ${y}` : `${t.months[m - 1]} ${d}, ${y}`;
}

export function shortDate(t, iso) {
  const { y, m, d, dow } = parseDate(iso);
  return t.lang === 'pt'
    ? `${t.days[dow]}, ${d} ${t.monthsShort[m - 1]} ${y}`
    : `${t.days[dow]} ${t.monthsShort[m - 1]} ${d}, ${y}`;
}

export function dayMonth(t, iso) {
  const { m, d } = parseDate(iso);
  return t.lang === 'pt' ? `${d} ${t.monthsShort[m - 1]}` : `${t.monthsShort[m - 1]} ${d}`;
}

export function monthYear(t, iso) {
  const { y, m } = parseDate(iso);
  const name = t.months[m - 1];
  return t.lang === 'pt' ? `${name[0].toUpperCase()}${name.slice(1)} de ${y}` : `${name} ${y}`;
}

// Pick the field for the current language, falling back to the other one.
export function pick(row, field, lang) {
  const other = lang === 'pt' ? 'en' : 'pt';
  return row[`${field}_${lang}`] || row[`${field}_${other}`] || '';
}

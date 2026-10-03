export const eur = (n: number) => `€${Math.round(n).toLocaleString('en')}`;
export const pct = (n: number, d = 0) => `${(n * 100).toFixed(d)}%`;
export const dur = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`);
export const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
export const nightsBetween = (a: string, b: string) => Math.max(1, Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000));
export const cn = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

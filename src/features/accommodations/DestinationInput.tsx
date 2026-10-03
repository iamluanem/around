'use client';
import { useId, useState } from 'react';
import { suggestCities, type City } from '@/data/cities';
import { cn } from '@/lib/format';

/** Free-text destination with autocomplete. Unavailable cities are still selectable (they lead to a "coming soon" state). */
export function DestinationInput({ value, onChange, onPick }: { value: string; onChange: (v: string) => void; onPick: (c: City) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(false); // show every city until the user starts typing
  const id = useId();
  const items = suggestCities(typed ? value : '');

  const pick = (c: City) => { onChange(c.name); onPick(c); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter' && open && items[active]) { e.preventDefault(); pick(items[active]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="relative">
      <input
        value={value} placeholder="Where to?" autoComplete="off" spellCheck={false}
        role="combobox" aria-expanded={open} aria-controls={id} aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setTyped(true); setOpen(true); setActive(0); }}
        onFocus={(e) => { setTyped(false); setOpen(true); e.currentTarget.select(); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKey}
        className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-ink-300 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {open && items.length > 0 && (
        <ul id={id} role="listbox" className="absolute left-[-20px] top-[calc(100%+14px)] z-50 w-[300px] animate-scale-in overflow-hidden rounded-3xl bg-white p-2 shadow-lift ring-1 ring-ink/5">
          {items.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)} onMouseEnter={() => setActive(i)}
                className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition', i === active && 'bg-sand-100')}>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm', c.available ? 'bg-terra-50 text-terra' : 'bg-sand-100 text-ink-400')}>⌖</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-ink">{c.name}</span>
                  <span className="block text-[12px] text-ink-500">{c.country}</span>
                </span>
                {c.available
                  ? <span className="rounded-full bg-olive-100 px-2 py-0.5 text-[10.5px] font-semibold text-olive">Live demo</span>
                  : <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10.5px] font-medium text-ink-500">Coming soon</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

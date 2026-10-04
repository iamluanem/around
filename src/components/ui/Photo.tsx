'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/format';
import { remoteFallback } from '@/lib/images';

const PALETTES = [
  ['#C2532B', '#E9B48A'], ['#5C6B3A', '#C9CFA8'], ['#B98A3A', '#F0D9A8'], ['#8FB3BF', '#E3EEF1'], ['#7A4B3A', '#E2C1A8'],
];

/** Image with an editorial gradient fallback, so the demo never shows a broken photo. */
export function Photo({ src, alt, className, label }: { src: string; alt: string; className?: string; label?: string }) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const onError = () => { const remote = remoteFallback(current); if (remote && remote !== current) setCurrent(remote); else setFailed(true); };
  useEffect(() => { setCurrent(src); setFailed(false); setLoaded(false); }, [src]);
  // An image can finish loading before React hydrates and attaches onLoad; check it directly.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete) el.naturalWidth > 0 ? setLoaded(true) : onError();
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = [...alt].reduce((s, c) => s + c.charCodeAt(0), 0);
  const [a, b] = PALETTES[h % PALETTES.length];
  return (
    <div className={cn(!className?.includes('absolute') && 'relative', 'overflow-hidden bg-sand-200', className)}>
      {failed ? (
        <div className="absolute inset-0 flex items-end p-4" style={{ background: `radial-gradient(120% 90% at 20% 10%, ${b}, ${a})` }}>
          <svg className="absolute right-4 top-4 h-10 w-10 text-white/50" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="22" r="8" /><path d="M2 30h36M8 34h24" /></svg>
          <span className="font-serif text-lg italic leading-tight text-white/90 drop-shadow-sm">{label ?? alt}</span>
        </div>
      ) : (
        <>
          {!loaded && <div className="shimmer absolute inset-0" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref} src={current} alt={alt} loading="lazy" referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={onError}
            className={cn('h-full w-full object-cover transition duration-700', loaded ? 'opacity-100' : 'opacity-0')}
          />
        </>
      )}
    </div>
  );
}

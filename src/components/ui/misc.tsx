'use client';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/format';

export function Stars({ rating, count, className }: { rating: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px] text-ink-700', className)}>
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-ink"><path d="M10 1.6l2.5 5.4 5.9.6-4.4 4 1.2 5.8L10 14.5l-5.2 2.9L6 11.6l-4.4-4 5.9-.6z" /></svg>
      <b className="font-semibold">{rating.toFixed(2)}</b>
      {count !== undefined && <span className="text-ink-500">({count.toLocaleString('en')})</span>}
    </span>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition',
        active ? 'bg-ink text-sand-50' : 'bg-white text-ink-700 ring-1 ring-ink/10 hover:ring-ink/30', className)}>
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'sand', className }: { children: ReactNode; tone?: 'sand' | 'olive' | 'terra' | 'gold'; className?: string }) {
  const t = { sand: 'bg-sand-100 text-ink-700', olive: 'bg-olive-100 text-olive', terra: 'bg-terra-50 text-terra-600', gold: 'bg-gold-100 text-[#8a6624]' }[tone];
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium', t, className)}>{children}</span>;
}

export function Modal({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={cn('max-h-[92vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-t-4xl bg-sand-50 p-6 shadow-lift sm:rounded-4xl sm:p-8', className)}>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, sub, className }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6', className)}>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h2 className="text-balance text-3xl font-medium leading-[1.05] sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">{sub}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-3xl', className)} />;
}

export function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />)}
    </span>
  );
}

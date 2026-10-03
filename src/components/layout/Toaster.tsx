'use client';
import { useToasts } from '@/lib/toast';
import { cn } from '@/lib/format';

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn('animate-fade-up rounded-2xl px-4 py-3 text-sm shadow-lift',
          t.kind === 'learning' ? 'bg-ink text-sand-50' : t.kind === 'success' ? 'bg-olive text-white' : 'bg-white text-ink ring-1 ring-ink/10')}>
          {t.kind === 'learning' && <span className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-terra-100">Learning</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}

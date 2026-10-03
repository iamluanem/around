'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { cn, eur } from '@/lib/format';

/** The business funnel, made visible: every step of the demo maps to one stage. */
export function FunnelProgress() {
  const ok = useHydrated();
  const s = useAround();
  const path = usePathname();
  if (!ok || path === '/concept' || path.startsWith('/admin')) return null;
  const expBooked = s.bookings.some((b) => b.kind === 'experience' || b.kind === 'bundle');
  const steps = [
    { label: 'Intent', done: true, href: '/' },
    { label: 'Taste', done: s.profileCompleted, href: '/profile' },
    { label: 'Discover', done: s.interactions.some((i) => i.targetType === 'accommodation'), href: '/stays' },
    { label: 'Match', done: !!s.selectedStayId, href: s.selectedStayId ? `/stays/${s.selectedStayId}` : '/stays' },
    { label: 'Book stay', done: !!s.stayBooking, href: s.selectedStayId ? `/stays/${s.selectedStayId}` : '/stays' },
    { label: 'Itinerary', done: !!s.itinerary, href: '/trip' },
    { label: 'Experiences', done: expBooked, href: '/trip' },
    { label: 'Bundle', done: s.bookings.some((b) => b.kind === 'bundle'), href: '/bundle' },
  ];
  const gmv = s.bookings.reduce((t, b) => t + b.amount, 0);
  const current = steps.findIndex((x) => !x.done);
  return (
    <div className="border-b hairline bg-sand-50/80">
      <div className="wrap no-scrollbar flex items-center gap-1 overflow-x-auto py-2 text-[12px]">
        {steps.map((st, i) => (
          <Link key={st.label} href={st.href} className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 transition',
            st.done ? 'text-olive' : i === current ? 'bg-white font-semibold text-ink ring-1 ring-ink/10' : 'text-ink-400 hover:text-ink')}>
            <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
              st.done ? 'bg-olive text-white' : i === current ? 'bg-terra text-white' : 'bg-ink/10 text-ink-500')}>{st.done ? '✓' : i + 1}</span>
            {st.label}
            {i < steps.length - 1 && <span className="ml-1 text-ink-300">›</span>}
          </Link>
        ))}
        <span className="ml-auto shrink-0 pl-4 text-ink-500">Trip GMV <b className="font-semibold text-ink">{eur(gmv)}</b></span>
      </div>
    </div>
  );
}

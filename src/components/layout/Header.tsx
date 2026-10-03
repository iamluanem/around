'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { TRIP_TYPE_LABEL } from '@/domain/labels';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { cn } from '@/lib/format';
import { Logo } from './Logo';
import { FunnelProgress } from './FunnelProgress';

const NAV = [
  { href: '/stays', label: 'Stays' },
  { href: '/experiences', label: 'Experiences' },
  { href: '/trip', label: 'My trip' },
  { href: '/concept', label: 'Concept' },
];

export function Header() {
  const path = usePathname();
  const ok = useHydrated();
  const profile = useAround((s) => s.profile);
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-sand-50/85 backdrop-blur-md">
      <div className="wrap flex h-16 items-center gap-6 border-b hairline">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn('rounded-full px-3.5 py-2 text-sm transition', path.startsWith(n.href) ? 'bg-ink/5 font-medium text-ink' : 'text-ink-500 hover:text-ink')}>{n.label}</Link>
          ))}
        </nav>
        <Link href="/profile" className="ml-auto hidden items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-[13px] shadow-soft ring-1 ring-ink/5 transition hover:ring-ink/20 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terra-50 text-sm">{profile.tripType === 'birthday' ? '🎂' : '✦'}</span>
          {ok ? <span><b className="font-semibold">{profile.destination}</b> · {TRIP_TYPE_LABEL[profile.tripType]} · {profile.travelers} guests</span> : <span className="text-ink-400">Your taste profile</span>}
        </Link>
        <button className="ml-auto rounded-full p-2 md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
      {open && (
        <nav className="wrap flex flex-col gap-1 border-b hairline py-3 md:hidden">
          {[...NAV, { href: '/profile', label: 'Taste profile' }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-[15px] hover:bg-ink/5">{n.label}</Link>
          ))}
        </nav>
      )}
      <FunnelProgress />
    </header>
  );
}

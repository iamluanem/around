import Link from 'next/link';

/** AROUND wordmark: an "O" ringed by an orbit — the stay at the centre, the trip around it. */
export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="AROUND home">
      <svg viewBox="0 0 32 32" className="h-8 w-8 transition-transform duration-700 group-hover:rotate-[30deg]" fill="none">
        <circle cx="16" cy="16" r="5" className="fill-terra" />
        <circle cx="16" cy="16" r="12.5" stroke="#1E1A16" strokeWidth="1.6" strokeDasharray="3 3.2" />
        <circle cx="27.5" cy="11" r="2.4" className="fill-olive" />
      </svg>
      <span className="font-sans text-[17px] font-semibold tracking-[0.28em]">AROUND</span>
    </Link>
  );
}

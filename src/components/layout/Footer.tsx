import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-24 border-t hairline">
      <div className="wrap flex flex-col gap-4 py-10 text-[13px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl">AROUND is an independent product concept and is not affiliated with Airbnb or any travel marketplace. Venues are fictional demo data; landmarks are real. All projected metrics are hypotheses.</p>
        <div className="flex gap-5">
          <Link className="link" href="/concept">Concept</Link>
          <Link className="link" href="/admin/analytics">Demo dashboard</Link>
        </div>
      </div>
    </footer>
  );
}

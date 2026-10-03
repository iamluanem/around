'use client';
import { useRouter } from 'next/navigation';
import { DEMO_PROFILE } from '@/domain/persona';
import { useAround } from '@/lib/store';

export function DemoStart() {
  const router = useRouter();
  const start = () => {
    useAround.getState().resetDemo();
    useAround.getState().setProfile(DEMO_PROFILE, true);
    router.push('/stays');
  };
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-ink/15 p-4 pr-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terra-50 text-xl">🎂</span>
      <div className="min-w-0 flex-1 text-[14px] leading-snug">
        <b className="font-semibold">3-minute demo:</b> a 30th birthday in Rome, Oct 20–24, for two.
        <span className="text-ink-500"> Food, wine, culture, romance, hidden gems · €500 for experiences.</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => router.push('/profile')} className="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-ink/15 hover:ring-ink/30">Customise</button>
        <button onClick={start} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700">Start demo →</button>
      </div>
    </div>
  );
}

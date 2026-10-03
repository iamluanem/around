'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DISCOVERY_LABEL, INTEREST_LABEL, paceLabel, STYLE_LABEL, TRIP_TYPE_LABEL } from '@/domain/labels';
import { tripDays } from '@/domain/recommendation/engine';
import { INTERESTS, TRAVEL_STYLES, TRIP_TYPES, type DiscoveryStyle, type TravelerProfile } from '@/domain/types';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/misc';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { cn, dayLabel, eur } from '@/lib/format';

const TRIP_ICON: Record<string, string> = { romantic: '♡', birthday: '🎂', friends: '✦', family: '⌂', solo: '◎', business: '▣', adventure: '△', relaxation: '◡' };
const STYLE_NOTE: Record<string, string> = {
  'local-explorer': 'Neighbourhood bars over landmarks', 'food-lover': 'Plans the day around meals', 'culture-seeker': 'Museums, ruins, stories',
  'luxury-traveler': 'The best table, the private tour', 'adventure-seeker': 'Bikes, scooters, early starts', 'relaxed-traveler': 'Long lunches, no alarms',
  'night-explorer': 'Comes alive after dark',
};
const BUDGETS = [50, 100, 150, 250];

export function TasteQuiz() {
  const ok = useHydrated();
  const stored = useAround((s) => s.profile);
  const setProfile = useAround((s) => s.setProfile);
  const router = useRouter();
  const [p, setP] = useState<TravelerProfile>(stored);
  const [step, setStep] = useState(0);
  const [showJson, setShowJson] = useState(false);
  useEffect(() => { if (ok) setP(useAround.getState().profile); }, [ok]);

  const days = tripDays(p);
  const up = (patch: Partial<TravelerProfile>) => setP((x) => ({ ...x, ...patch }));
  const dates = Array.from({ length: days }, (_, i) => new Date(Date.parse(p.startDate) + i * 86_400_000).toISOString().slice(0, 10));

  const steps = [
    {
      q: 'What kind of trip are you planning?',
      body: (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRIP_TYPES.map((t) => (
              <button key={t} onClick={() => up({ tripType: t, occasion: t === 'birthday' ? p.occasion ?? 'Birthday' : p.occasion, occasionDate: t === 'birthday' || t === 'romantic' ? p.occasionDate ?? dates[Math.min(2, days - 1)] : undefined })}
                className={cn('flex h-28 flex-col items-start justify-between rounded-3xl p-4 text-left transition', p.tripType === t ? 'bg-ink text-sand-50 shadow-lift' : 'bg-white ring-1 ring-ink/10 hover:ring-ink/30')}>
                <span className="text-2xl">{TRIP_ICON[t]}</span>
                <span className="font-medium">{TRIP_TYPE_LABEL[t]}</span>
              </button>
            ))}
          </div>
          {(p.tripType === 'birthday' || p.tripType === 'romantic') && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-terra-50 p-4 text-sm">
              <span className="font-medium">The big day is</span>
              <select value={p.occasionDate} onChange={(e) => up({ occasionDate: e.target.value })} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10">
                {dates.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
              </select>
              {p.tripType === 'birthday' && (
                <input value={p.occasion ?? ''} onChange={(e) => up({ occasion: e.target.value })} placeholder="e.g. 30th birthday" className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10" />
              )}
            </div>
          )}
        </>
      ),
      valid: true,
    },
    {
      q: 'What are you into?',
      hint: 'Pick as many as you like — we learn the rest from what you click.',
      body: (
        <div className="flex flex-wrap gap-2.5">
          {INTERESTS.map((i) => (
            <Chip key={i} active={p.interests.includes(i)} onClick={() => up({ interests: p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i], affinities: { ...p.affinities, [i]: undefined } })} className="h-11 px-5 text-sm">
              {INTEREST_LABEL[i]}
            </Chip>
          ))}
        </div>
      ),
      valid: p.interests.length > 0,
    },
    {
      q: 'What’s your travel style?',
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {TRAVEL_STYLES.map((s) => (
            <button key={s} onClick={() => up({ style: s })} className={cn('rounded-3xl p-5 text-left transition', p.style === s ? 'bg-ink text-sand-50 shadow-lift' : 'bg-white ring-1 ring-ink/10 hover:ring-ink/30')}>
              <div className="font-serif text-xl">{STYLE_LABEL[s]}</div>
              <div className={cn('mt-1 text-sm', p.style === s ? 'text-sand-200' : 'text-ink-500')}>{STYLE_NOTE[s]}</div>
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
    {
      q: 'What’s your experience budget?',
      hint: 'For activities and reservable tables, for your whole party. Walk-in meals are shown separately.',
      body: (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BUDGETS.map((b) => (
              <button key={b} onClick={() => up({ budgetPerDay: b, totalBudget: b * days })}
                className={cn('rounded-3xl p-5 text-left transition', p.budgetPerDay === b ? 'bg-ink text-sand-50 shadow-lift' : 'bg-white ring-1 ring-ink/10 hover:ring-ink/30')}>
                <div className="font-serif text-3xl">€{b}{b === 250 ? '+' : ''}</div><div className="text-sm opacity-70">per day</div>
              </button>
            ))}
          </div>
          <label className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-500">
            or set a trip total
            <span className="flex items-center rounded-full bg-white px-4 py-2 ring-1 ring-ink/10">€
              <input type="number" min={50} step={10} value={p.totalBudget} onChange={(e) => { const t = Math.max(0, Number(e.target.value)); up({ totalBudget: t, budgetPerDay: Math.round(t / days) }); }} className="w-20 bg-transparent font-medium text-ink outline-none" />
            </span>
            ≈ {eur(p.totalBudget / days)}/day over {days} days
          </label>
        </>
      ),
      valid: p.totalBudget > 0,
    },
    {
      q: 'How do you like to travel?',
      body: (
        <div className="rounded-4xl bg-white p-8 ring-1 ring-ink/10">
          <input type="range" min={0} max={100} value={p.pace} onChange={(e) => up({ pace: Number(e.target.value) })} className="w-full accent-[#C2532B]" />
          <div className="mt-3 flex justify-between text-sm text-ink-500"><span>Relaxed</span><span className="font-serif text-xl capitalize text-ink">{paceLabel(p.pace)}</span><span>Packed</span></div>
          <p className="mt-4 text-sm text-ink-500">{paceLabel(p.pace) === 'relaxed' ? 'We’ll leave out lunches and optional detours.' : paceLabel(p.pace) === 'packed' ? 'We’ll add nightcaps and extra stops.' : 'Three or four highlights a day, with room to wander.'}</p>
        </div>
      ),
      valid: true,
    },
    {
      q: 'Do you prefer…',
      body: (
        <div className="grid gap-3 sm:grid-cols-3">
          {(['highlights', 'balanced', 'local'] as DiscoveryStyle[]).map((d) => (
            <button key={d} onClick={() => up({ discoveryStyle: d })} className={cn('rounded-3xl p-6 text-left transition', p.discoveryStyle === d ? 'bg-ink text-sand-50 shadow-lift' : 'bg-white ring-1 ring-ink/10 hover:ring-ink/30')}>
              <div className="font-serif text-xl">{DISCOVERY_LABEL[d]}</div>
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
  ];

  const last = step === steps.length - 1;
  const finish = () => { setProfile(p, true); router.push('/stays'); };
  const cur = steps[step];

  return (
    <div className="wrap max-w-3xl py-12">
      <div className="mb-10 flex items-center gap-2">
        {steps.map((_, i) => <button key={i} onClick={() => setStep(i)} className={cn('h-1.5 flex-1 rounded-full transition', i <= step ? 'bg-terra' : 'bg-ink/10')} aria-label={`Step ${i + 1}`} />)}
      </div>
      <div className="eyebrow mb-3">Travel Taste Profile · {step + 1} of {steps.length}</div>
      <h1 key={step} className="mb-2 animate-fade-up text-4xl font-medium sm:text-5xl">{cur.q}</h1>
      {cur.hint && <p className="mb-8 text-ink-500">{cur.hint}</p>}
      <div key={`b${step}`} className={cn('animate-fade-up', !cur.hint && 'mt-8')}>{cur.body}</div>

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>← Back</Button>
        {last ? <Button size="lg" onClick={finish}>See my matches →</Button> : <Button size="lg" variant="dark" disabled={!cur.valid} onClick={() => setStep(step + 1)}>Continue</Button>}
      </div>

      <div className="mt-14 border-t hairline pt-6">
        <button onClick={() => setShowJson(!showJson)} className="text-sm text-ink-500 hover:text-ink">{showJson ? '▾' : '▸'} View stored profile JSON</button>
        {showJson && (
          <pre className="mt-3 overflow-x-auto rounded-3xl bg-ink p-5 text-[12.5px] leading-relaxed text-sand-100">{JSON.stringify({
            tripType: p.tripType, travelers: p.travelers, interests: p.interests, style: p.style, budgetPerDay: p.budgetPerDay, totalBudget: p.totalBudget,
            pace: paceLabel(p.pace), discoveryStyle: p.discoveryStyle, destination: p.destination, dates: [p.startDate, p.endDate], occasion: p.occasion, occasionDate: p.occasionDate,
            learnedAffinities: p.affinities,
          }, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

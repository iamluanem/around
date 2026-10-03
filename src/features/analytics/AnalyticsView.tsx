'use client';
import { useEffect, useState } from 'react';
import { INTEREST_LABEL, CATEGORY_LABEL } from '@/domain/labels';
import type { ExperienceCategory } from '@/domain/types';
import type { AnalyticsReport } from '@/services/analytics';
import { Skeleton } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { eur, pct } from '@/lib/format';

function Kpi({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
      <div className="text-[12px] font-medium text-ink-500">{label}</div>
      <div className="mt-2 font-serif text-4xl font-medium tabular-nums">{value}</div>
      <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-ink-500">{delta && <span className="rounded-full bg-olive-100 px-2 py-0.5 font-medium text-olive">{delta}</span>}{sub}</div>
    </div>
  );
}

function Bars({ rows, color = 'bg-ink', format = (n: number) => String(n) }: { rows: { label: string; value: number; extra?: string }[]; color?: string; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[120px_1fr_64px] items-center gap-3 text-[13px]">
          <span className="truncate text-ink-700">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-ink/5"><span className={`block h-full rounded-full ${color}`} style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums text-ink-500">{format(r.value)}{r.extra}</span>
        </li>
      ))}
    </ul>
  );
}

function MatchConversionChart({ data }: { data: AnalyticsReport['matchVsConversion'] }) {
  const max = Math.max(...data.map((d) => d.rate), 0.01);
  return (
    <div>
      <div className="flex h-56 items-end gap-3 border-b hairline pb-2">
        {data.map((d) => (
          <div key={d.bucket} className="flex flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[12px] font-semibold tabular-nums">{pct(d.rate, 1)}</span>
            <div className="w-full max-w-[64px] rounded-t-xl bg-olive transition-all duration-700" style={{ height: `${Math.max(4, (d.rate / max) * 170)}px`, opacity: 0.45 + 0.55 * (d.rate / max) }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">{data.map((d) => <div key={d.bucket} className="flex-1 text-center text-[11.5px] text-ink-500">{d.bucket}%<br /><span className="text-ink-400">n={d.views}</span></div>)}</div>
    </div>
  );
}

export function AnalyticsView() {
  const ok = useHydrated();
  const [r, setR] = useState<AnalyticsReport | null>(null);
  const s = useAround();
  useEffect(() => { api.analytics().then(setR).catch(() => {}); }, []);

  const mine = s.interactions.reduce<Record<string, number>>((a, i) => ((a[i.type] = (a[i.type] ?? 0) + 1), a), {});
  const myGmv = s.bookings.reduce((t, b) => t + b.amount, 0);
  const expGmv = s.bookings.filter((b) => b.kind !== 'stay').reduce((t, b) => t + b.amount, 0);

  return (
    <div className="wrap py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Internal · demo dashboard</div>
          <h1 className="text-4xl font-medium sm:text-5xl">Experience commerce, <em className="font-light text-terra">measured</em></h1>
        </div>
        <span className="rounded-full bg-gold-100 px-3 py-1.5 text-[12px] font-medium text-[#8a6624]">Simulated cohort · all response curves are hypotheses</span>
      </div>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ink-500">
        {r ? `${r.cohortSize} synthetic travelers with randomised taste profiles. Every Experience Match is computed by the production engine; booking behaviour follows the hypothesised curves listed below. Treatment ranks stays by Experience Match; control ranks by rating.` : 'Loading…'}
      </p>

      {!r ? <Skeleton className="mt-8 h-96" /> : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Accommodation conversion" value={pct(r.kpis.stayConversion, 1)} delta={`+${((r.kpis.stayConversion / r.kpis.stayConversionControl - 1) * 100).toFixed(0)}% vs control`} sub={`control ${pct(r.kpis.stayConversionControl, 1)}`} />
            <Kpi label="Experience attach rate" value={pct(r.kpis.attachRate)} sub="of stay bookings add ≥1 experience" />
            <Kpi label="Avg experience order value" value={eur(r.kpis.avgExperienceOrderValue)} sub="per attached booking" />
            <Kpi label="Bundle conversion" value={pct(r.kpis.bundleConversion)} sub="of multi-experience orders" />
            <Kpi label="Recommendation CTR" value={pct(r.kpis.recommendationCTR, 1)} sub="top-12 personalised slots" />
            <Kpi label="GMV per traveler" value={eur(r.kpis.gmvPerTraveler)} delta={`+${((r.kpis.gmvPerTraveler / r.kpis.gmvPerTravelerControl - 1) * 100).toFixed(0)}% vs control`} sub={`control ${eur(r.kpis.gmvPerTravelerControl)}`} />
            <Kpi label="Live interactions (all sessions)" value={String(Object.values(r.live.interactions).reduce((a, b) => a + b, 0))} sub={Object.entries(r.live.interactions).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none yet'} />
            <Kpi label="Live bookings (all sessions)" value={String(r.live.bookings)} sub={`${eur(r.live.gmv)} demo GMV`} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="eyebrow">Experience Match vs booking conversion</div>
              <p className="mb-6 mt-1 text-[13px] text-ink-500">Per stay view, bucketed by match score. The core hypothesis: higher match → higher conversion.</p>
              <MatchConversionChart data={r.matchVsConversion} />
            </div>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="eyebrow mb-4">Most converted neighborhoods</div>
              <Bars rows={r.neighborhoods.map((n) => ({ label: n.label, value: n.bookings, extra: '' }))} color="bg-terra" />
            </div>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="eyebrow mb-4">Top traveler interests</div>
              <Bars rows={r.topInterests.map((i) => ({ label: INTEREST_LABEL[i.label], value: i.count }))} color="bg-olive" />
            </div>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="eyebrow mb-4">Top booked experience categories</div>
              <Bars rows={r.topCategories.map((c) => ({ label: CATEGORY_LABEL[c.label as ExperienceCategory] ?? c.label, value: c.count }))} color="bg-gold" />
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-ink p-6 text-sand-50">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-terra-100">This session (you)</div>
              {ok && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-[14px] sm:grid-cols-4">
                  <div><div className="font-serif text-3xl">{s.interactions.length}</div><div className="text-sand-300">interactions</div></div>
                  <div><div className="font-serif text-3xl">{s.bookings.length}</div><div className="text-sand-300">bookings</div></div>
                  <div><div className="font-serif text-3xl">{eur(myGmv)}</div><div className="text-sand-300">GMV</div></div>
                  <div><div className="font-serif text-3xl">{myGmv ? pct(expGmv / myGmv) : '—'}</div><div className="text-sand-300">from experiences</div></div>
                </div>
              )}
              <div className="mt-4 text-[12.5px] text-sand-300">{Object.entries(mine).map(([k, v]) => `${k} ${v}`).join(' · ') || 'Interact with the demo to see your events here.'}</div>
            </div>
            <div className="rounded-3xl bg-white p-6 text-[13px] ring-1 ring-ink/5">
              <div className="eyebrow mb-3">Model assumptions (hypotheses to validate)</div>
              <ul className="space-y-2 font-mono text-[12px] text-ink-700">{Object.values(r.hypotheses).map((h) => <li key={h}>• {h}</li>)}</ul>
              <p className="mt-3 text-ink-500">None of these are real marketplace metrics. They define what an A/B test would measure.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

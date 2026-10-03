'use client';
import { useState } from 'react';
import { CATEGORY_LABEL, INTEREST_LABEL } from '@/domain/labels';
import type { Experience, MatchResult } from '@/domain/types';
import { Photo } from '@/components/ui/Photo';
import { MatchRing } from '@/components/ui/MatchRing';
import { Modal, Stars, Tag } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { MatchBreakdown } from '@/features/recommendations/MatchBreakdown';
import { api } from '@/lib/api';
import { bookedExperienceIds, useAround } from '@/lib/store';
import { toast } from '@/lib/toast';
import { dur, eur } from '@/lib/format';
import { ExperienceActions } from './ExperienceCard';

export function ExperienceModal({ e, match, walk, onClose }: { e: Experience | null; match?: MatchResult; walk?: number; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const bookings = useAround((s) => s.bookings);
  const addBooking = useAround((s) => s.addBooking);
  if (!e || !match) return null;
  const booked = bookedExperienceIds(bookings).includes(e.id);
  const book = async () => {
    setBusy(true);
    try { const b = await api.bookExperience(e.id); addBooking(b); toast(`Booked ${e.name} · ${b.confirmation}`, 'success'); }
    catch (err) { toast((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} className="max-w-2xl p-0 sm:p-0">
      <div className="relative">
        <Photo src={e.image} alt={e.name} className="h-56 w-full sm:h-64" />
        <ExperienceActions e={e} className="absolute right-4 top-4" />
        <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg shadow-soft" aria-label="Close">×</button>
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="eyebrow">{CATEGORY_LABEL[e.category]} · {e.neighborhood}</div>
            <h3 className="mt-1 text-3xl font-medium leading-tight">{e.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-ink-500">
              <Stars rating={e.rating} count={e.reviewCount} /> <span>{dur(e.durationMin)}</span>{walk !== undefined && <span>{walk} min walk</span>}
              <span className="font-semibold text-ink">{e.price === 0 ? 'Free' : `${eur(e.price)} for 2`}</span>
            </div>
          </div>
          <MatchRing score={match.score} size={68} />
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{e.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{e.tags.map((t) => <Tag key={t}>{INTEREST_LABEL[t]}</Tag>)}</div>
        <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-ink/5">
          <div className="eyebrow mb-3">Why it matches you</div>
          <ul className="mb-5 space-y-1.5 text-[14px]">{match.reasons.map((r) => <li key={r} className="flex gap-2"><span className="text-olive">✓</span>{r}</li>)}</ul>
          <MatchBreakdown match={match} compact />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {e.bookable ? (
            booked ? <Button variant="soft" disabled>✓ Booked</Button> : <Button onClick={book} disabled={busy}>{busy ? 'Booking…' : `Book · ${eur(e.price)}`}</Button>
          ) : <span className="text-sm text-ink-500">{e.price === 0 ? 'Free, no booking needed.' : 'Walk-in · pay at the venue.'}</span>}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

'use client';
import type { Experience, MatchResult } from '@/domain/types';
import { CATEGORY_LABEL } from '@/domain/labels';
import { Photo } from '@/components/ui/Photo';
import { MatchPill } from '@/components/ui/MatchRing';
import { Stars } from '@/components/ui/misc';
import { useAround } from '@/lib/store';
import { cn, dur, eur } from '@/lib/format';

export function ExperienceActions({ e, className }: { e: Experience; className?: string }) {
  const { saved, liked, toggleSave, toggleLike, dismiss } = useAround();
  const btn = 'flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-soft backdrop-blur transition hover:scale-110';
  return (
    <div className={cn('flex gap-1.5', className)} onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}>
      <button aria-label="Save" title="Save" className={btn} onClick={() => toggleSave(e.id, e.tags)}>
        <svg viewBox="0 0 24 24" className={cn('h-4 w-4', saved.includes(e.id) ? 'fill-terra stroke-terra' : 'fill-none stroke-ink')} strokeWidth="2"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
      </button>
      <button aria-label="More like this" title="More like this" className={btn} onClick={() => toggleLike(e.id, e.tags)}>
        <svg viewBox="0 0 24 24" className={cn('h-4 w-4', liked.includes(e.id) ? 'fill-olive stroke-olive' : 'fill-none stroke-ink')} strokeWidth="2"><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" /></svg>
      </button>
      <button aria-label="Not for me" title="Not for me" className={btn} onClick={() => dismiss(e.id, e.tags)}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-ink" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}

export function ExperienceCard({ e, match, walk, onOpen, onHover, className }: {
  e: Experience; match: MatchResult; walk: number; onOpen: () => void; onHover?: (id: string | null) => void; className?: string;
}) {
  return (
    <article onClick={onOpen} onMouseEnter={() => onHover?.(e.id)} onMouseLeave={() => onHover?.(null)} className={cn('group cursor-pointer animate-fade-up', className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
        <Photo src={e.image} alt={e.name} className="h-full w-full transition duration-700 group-hover:scale-[1.04]" />
        <MatchPill score={match.score} className="absolute left-3 top-3" />
        <ExperienceActions e={e} className="absolute right-3 top-3 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" />
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">{CATEGORY_LABEL[e.category]} · {walk} min walk</span>
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-[18px] font-medium leading-snug">{e.name}</h3>
          <Stars rating={e.rating} className="mt-1 shrink-0" />
        </div>
        <div className="mt-1 text-[13px] text-ink-500">{dur(e.durationMin)} · {e.price === 0 ? 'Free' : `${eur(e.price)} for 2${e.bookable ? '' : ' · pay at venue'}`}</div>
        {match.reasons[0] && <p className="mt-1.5 text-[13px] leading-snug text-olive">✓ {match.reasons[0]}</p>}
      </div>
    </article>
  );
}

'use client';
import { useState } from 'react';
import { findCity, CITIES } from '@/data/cities';
import { Button, ButtonLink } from '@/components/ui/Button';
import { toast } from '@/lib/toast';

/** Shown when a traveler searches a city without a demo catalogue. */
export function ComingSoon({ query }: { query: string }) {
  const city = findCity(query);
  const name = city?.name ?? query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const [joined, setJoined] = useState(false);
  const soon = CITIES.filter((c) => !c.available && c.id !== city?.id).slice(0, 5);
  return (
    <div className="mx-auto max-w-2xl animate-fade-up py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand-100 text-2xl">⌖</div>
      <div className="eyebrow mt-6">{city ? `${city.name}, ${city.country}` : 'Destination'}</div>
      <h1 className="mt-3 text-balance text-4xl font-medium leading-tight sm:text-5xl">
        AROUND isn’t in {name || 'that city'} <em className="font-light text-terra">yet.</em>
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink-500">
        This proof of concept ships with a hand-curated catalogue for Rome: stays, experiences, restaurants and nightlife, all scored by the Experience Match engine. New cities plug into the same engine through the catalogue repository.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/stays" size="lg">Explore Rome instead →</ButtonLink>
        <Button variant="secondary" size="lg" disabled={joined} onClick={() => { setJoined(true); toast(`We'll let you know when ${name} goes live`, 'success'); }}>
          {joined ? '✓ On the list' : `Notify me about ${name || 'it'}`}
        </Button>
      </div>
      {soon.length > 0 && (
        <p className="mt-10 text-[13px] text-ink-400">Also coming: {soon.map((c) => c.name).join(' · ')}</p>
      )}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { DISCOVERY_LABEL, INTEREST_LABEL, STYLE_LABEL, TRIP_TYPE_LABEL } from '@/domain/labels';
import type { TravelerProfile } from '@/domain/types';
import { Tag } from '@/components/ui/misc';
import { eur } from '@/lib/format';

export function ProfileBar({ profile }: { profile: TravelerProfile }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px]">
      <span className="text-ink-500">Ranked for</span>
      <Tag tone="terra">{profile.occasion ?? TRIP_TYPE_LABEL[profile.tripType]}</Tag>
      {profile.interests.map((i) => <Tag key={i}>{INTEREST_LABEL[i]}</Tag>)}
      <Tag tone="olive">{STYLE_LABEL[profile.style]}</Tag>
      <Tag tone="gold">{eur(profile.totalBudget)} experiences</Tag>
      <Tag>{DISCOVERY_LABEL[profile.discoveryStyle]}</Tag>
      <Link href="/profile" className="link ml-1 text-ink-500">Edit</Link>
    </div>
  );
}

import type { Accommodation } from '@/domain/types';
import { maps } from '@/providers/maps';

export const LANDMARKS = [
  { name: 'Colosseum', lat: 41.8902, lng: 12.4922 },
  { name: 'Pantheon', lat: 41.8986, lng: 12.4769 },
  { name: 'Trevi Fountain', lat: 41.9009, lng: 12.4833 },
  { name: 'Vatican', lat: 41.9029, lng: 12.4534 },
  { name: 'Trastevere', lat: 41.8897, lng: 12.4692 },
];

export function nearestLandmarks(stay: Accommodation, n = 2) {
  return LANDMARKS.map((l) => ({ name: l.name, minutes: maps.walkingMinutes(stay, l) }))
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, n);
}

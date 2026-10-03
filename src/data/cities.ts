/** Destinations the search understands. Only cities with a catalogue are bookable in the demo. */
export interface City { id: string; name: string; country: string; available: boolean; aliases?: string[] }

export const CITIES: City[] = [
  { id: 'rome', name: 'Rome', country: 'Italy', available: true, aliases: ['roma', 'rom', 'rzym'] },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', available: false, aliases: ['lisboa'] },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', available: false },
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', available: false },
  { id: 'paris', name: 'Paris', country: 'France', available: false },
  { id: 'florence', name: 'Florence', country: 'Italy', available: false, aliases: ['firenze', 'florença'] },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', available: false, aliases: ['cdmx', 'cidade do méxico'] },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', available: false, aliases: ['rio'] },
  { id: 'new-york', name: 'New York', country: 'United States', available: false, aliases: ['nyc', 'nova york', 'nova iorque'] },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', available: false, aliases: ['tóquio'] },
];

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function findCity(q: string): City | undefined {
  const n = norm(q).split(',')[0].trim();
  if (!n) return undefined;
  return CITIES.find((c) => norm(c.name) === n || c.id === n || c.aliases?.some((a) => norm(a) === n));
}

export function suggestCities(q: string, limit = 6): City[] {
  const n = norm(q);
  if (!n) return CITIES.slice(0, limit);
  const score = (c: City) => {
    const keys = [c.name, c.country, ...(c.aliases ?? [])].map(norm);
    if (keys.some((k) => k.startsWith(n))) return 0;
    if (keys.some((k) => k.includes(n))) return 1;
    return 9;
  };
  return CITIES.map((c) => ({ c, s: score(c) })).filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || Number(b.c.available) - Number(a.c.available)).slice(0, limit).map((x) => x.c);
}

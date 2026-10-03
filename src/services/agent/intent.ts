import type { Interest, TravelerProfile, TripType } from '@/domain/types';
import type { AgentAction } from '@/providers/ai/types';

/**
 * Deterministic natural-language → action planner used by the MockAIProvider.
 * An LLM provider produces the same AgentAction[] via function-calling.
 */

const DISLIKE = /(don'?t|do not|dont|no more|hate|skip|avoid|without|not into|not a fan of|remove|drop|less)\b/;

const TOPICS: { re: RegExp; subcategories?: string[]; tags?: Interest[]; label: string }[] = [
  { re: /museum|galler(y|ies)/, subcategories: ['museum'], label: 'museums' },
  { re: /nightlife|clubs?|bars?|late nights?/, tags: ['nightlife'], label: 'nightlife' },
  { re: /wine|alcohol|drinks?/, tags: ['wine'], label: 'wine' },
  { re: /shopping|shops?/, tags: ['shopping'], label: 'shopping' },
  { re: /sport|stadium/, tags: ['sports'], label: 'sports' },
  { re: /adventure|bike|vespa/, tags: ['adventure'], label: 'adventure activities' },
  { re: /luxury|fancy|expensive/, tags: ['luxury'], label: 'luxury experiences' },
  { re: /tours?\b/, subcategories: ['tour'], label: 'guided tours' },
  { re: /class(es)?|workshops?/, subcategories: ['class', 'workshop'], label: 'classes' },
];

const MORE: { re: RegExp; tags: Interest[] }[] = [
  { re: /food|eat|cuisine|pasta/, tags: ['food'] },
  { re: /wine/, tags: ['wine'] },
  { re: /art|painting/, tags: ['art'] },
  { re: /history|ancient|ruins/, tags: ['history'] },
  { re: /music|jazz|opera|concert/, tags: ['music'] },
  { re: /nightlife|party|bars?/, tags: ['nightlife'] },
  { re: /nature|parks?|outdoors?|garden/, tags: ['nature'] },
  { re: /wellness|spa|relaxing/, tags: ['wellness'] },
];

const REPLACE_TARGETS = ['restaurant', 'dinner', 'lunch', 'breakfast', 'class', 'tour', 'walk', 'drinks', 'cocktail', 'sunset', 'museum', 'experience', 'activity'];

export function planActions(message: string): AgentAction[] {
  const m = message.toLowerCase().replace(/[’‘]/g, "'");
  const actions: AgentAction[] = [];

  if (/\b(reset|start over|undo everything|original plan)\b/.test(m)) return [{ type: 'reset' }];

  // replace X / another X / swap X
  const rep = m.match(/\b(replace|swap|change|another|different|other)\b[^.]*?\b(restaurant|dinner|lunch|breakfast|class|tour|walk|drinks|cocktail|sunset|museum|experience|activity)\b/);
  if (rep) {
    const date = m.match(/\b(?:oct(?:ober)?\.?\s*)?(2\d)(?:st|nd|rd|th)?\b/)?.[1];
    actions.push({ type: 'replace', target: rep[2], date: /birthday/.test(m) ? 'occasion' : date ? `2026-10-${date}` : undefined });
  }

  if (/romantic|romance|more special|intimate|memorable|magical/.test(m)) actions.push({ type: 'romance', scope: /birthday|big day|the day/.test(m) ? 'occasion' : 'all' });

  const money = m.match(/(?:less than|under|below|max(?:imum)?|budget(?: of| to)?|only|up to|within)\s*€?\s*(\d{2,5})|€\s*(\d{2,5})|(\d{2,5})\s*(?:€|eur|euros?)/);
  if (money && /spend|budget|under|less|cheaper|max|cost|€|eur/.test(m)) actions.push({ type: 'budget', amount: Number(money[1] ?? money[2] ?? money[3]) });
  else if (/cheaper|save money|too expensive|lower (the )?cost|less expensive/.test(m)) actions.push({ type: 'budget', amount: -0.85 });

  if (/local|hidden|authentic|off the beaten|less touristy|like a roman|non-touristy|fewer tourists/.test(m)) actions.push({ type: 'local' });

  if (DISLIKE.test(m)) {
    for (const t of TOPICS) if (t.re.test(m) && !(rep && t.label === 'museums' && rep[2] === 'museum')) actions.push({ type: 'exclude', subcategories: t.subcategories ?? [], tags: t.tags ?? [], label: t.label });
  } else if (/\b(more|love|add|extra|really like|into)\b/.test(m)) {
    const tags = MORE.filter((x) => x.re.test(m)).flatMap((x) => x.tags);
    if (tags.length && !actions.some((a) => a.type === 'local')) actions.push({ type: 'more', tags });
  }

  if (/\b(relax(ed)?|slow(er)? down|less packed|too (busy|much)|lazy|more rest|more downtime)\b/.test(m)) actions.push({ type: 'pace', direction: 'down' });
  else if (/packed|busier|more activities|fill (my|the) days|do more/.test(m)) actions.push({ type: 'pace', direction: 'up' });

  if (/bundle|package|book (it )?all|book everything|checkout|buy/.test(m)) actions.push({ type: 'bundle' });
  if (/how much|total|budget left|what('s| is) the cost|summary|overview/.test(m) && !actions.some((a) => a.type === 'budget')) actions.push({ type: 'summary' });

  return actions.length ? actions : [{ type: 'help' }];
}

export function replaceTargetMatches(target: string, slot: string, category: string, subcategory: string) {
  if (!REPLACE_TARGETS.includes(target)) return false;
  switch (target) {
    case 'restaurant': return category === 'restaurant';
    case 'dinner': return slot.includes('dinner');
    case 'lunch': return slot === 'lunch';
    case 'breakfast': return slot === 'breakfast';
    case 'class': return slot === 'class' || subcategory === 'class';
    case 'drinks': case 'cocktail': return slot === 'cocktail' || slot === 'nightcap';
    case 'sunset': return slot === 'sunset';
    case 'museum': return subcategory === 'museum';
    case 'walk': return category === 'walk';
    case 'tour': return category === 'tour';
    default: return true;
  }
}

/** Free-text trip request → profile patch ("It's my 30th birthday… budget around €500"). */
export function parseTripRequest(text: string, base: TravelerProfile): { profile: TravelerProfile; understood: string[] } {
  const m = text.toLowerCase();
  const p: TravelerProfile = { ...base, interests: [...base.interests] };
  const understood: string[] = [];
  const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const range = m.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})\s*(?:–|-|to|until|through)\s*(\d{1,2})/);
  if (range) {
    const mm = months[range[1]];
    p.startDate = `2026-${mm}-${range[2].padStart(2, '0')}`;
    p.endDate = `2026-${mm}-${range[3].padStart(2, '0')}`;
    understood.push(`Dates ${range[1].toUpperCase()} ${range[2]}–${range[3]}`);
  }
  const dest = text.match(/\bin ([A-Z][a-z]+)/);
  if (dest) { p.destination = dest[1]; understood.push(`Destination ${dest[1]}`); }
  const bday = m.match(/(\d{2})(?:st|nd|rd|th)? birthday|birthday/);
  if (bday) {
    p.tripType = 'birthday' as TripType;
    p.occasion = bday[1] ? `${bday[1]}th birthday` : 'Birthday';
    const s = Date.parse(p.startDate);
    p.occasionDate = new Date(s + 2 * 86_400_000).toISOString().slice(0, 10);
    understood.push(`Occasion: ${p.occasion}`);
  } else if (/honeymoon|anniversary|romantic/.test(m)) { p.tripType = 'romantic'; understood.push('Romantic trip'); }
  if (/partner|wife|husband|girlfriend|boyfriend|fianc|my love|couple/.test(m)) { p.travelers = 2; understood.push('2 travelers (couple)'); }
  const add = (t: Interest, re: RegExp, label: string) => { if (re.test(m) && !p.interests.includes(t)) p.interests.push(t); if (re.test(m)) understood.push(label); };
  add('food', /food|eat|cuisine|restaurants?/, 'Loves food');
  add('wine', /wine/, 'Loves wine');
  add('romantic', /beautiful|romantic|special|views?/, 'Beautiful, romantic places');
  add('art', /\bart\b|galler/, 'Art');
  add('history', /history|ancient/, 'History');
  const budget = m.match(/(?:budget|around|about|up to|max)[^\d€]{0,12}€?\s*(\d{2,5})|€\s*(\d{2,5})/);
  if (budget) {
    p.totalBudget = Number(budget[1] ?? budget[2]);
    const days = Math.max(1, Math.round((Date.parse(p.endDate) - Date.parse(p.startDate)) / 86_400_000));
    p.budgetPerDay = Math.round(p.totalBudget / days);
    understood.push(`Experience budget €${p.totalBudget}`);
  }
  return { profile: p, understood: [...new Set(understood)] };
}

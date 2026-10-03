import { ACCOMMODATIONS, EXPERIENCES } from '../src/data/rome';
import { DEMO_PROFILE } from '../src/domain/persona';
import { matchStay } from '../src/domain/recommendation/engine';

for (const s of ACCOMMODATIONS) {
  const m = matchStay(s, EXPERIENCES, DEMO_PROFILE);
  const b = Object.entries(m.breakdown).map(([k, v]) => `${k}=${v.toFixed(2)}`).join(' ');
  console.log(String(m.score).padStart(3), s.neighborhood.padEnd(16), b);
  console.log('     ', m.headline, '|', m.reasons.join(' · '), m.cautions.length ? '| ⚠ ' + m.cautions.join(' · ') : '');
}

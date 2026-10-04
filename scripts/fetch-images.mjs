// Downloads every Unsplash photo referenced in src/ into public/images/<id>.jpg.
// Run once: `npm run images:fetch`. Already-downloaded files are skipped.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/images';
const W = 1400;

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
});

const ids = [...new Set(walk('src').flatMap((f) => readFileSync(f, 'utf8').match(/photo-\d+-[0-9a-f]+/g) ?? []))].sort();
mkdirSync(OUT, { recursive: true });

let ok = 0, skipped = 0, failed = 0;
for (const id of ids) {
  const dest = join(OUT, `${id}.jpg`);
  if (existsSync(dest)) { skipped++; continue; }
  try {
    const res = await fetch(`https://images.unsplash.com/${id}?auto=format&fm=jpg&fit=crop&w=${W}&q=72`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++; process.stdout.write(`✓ ${id}\n`);
  } catch (e) {
    failed++; console.error(`✗ ${id}: ${e.message}`);
  }
}
console.log(`\n${ids.length} photos · ${ok} downloaded · ${skipped} already present · ${failed} failed`);
if (failed) process.exit(1);

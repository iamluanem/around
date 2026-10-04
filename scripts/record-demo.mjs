// Records a narrated walkthrough of the AROUND demo.
// Usage: npm run dev (in another terminal), then `npm run record:demo`.
// Env: BASE_URL (default http://localhost:3000), OUT (default docs/demo).
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.OUT ?? 'docs/demo';
const W = 1440, H = 900;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Visible cursor + caption bar, injected on every page load.
const OVERLAY = `
(() => {
  const mount = () => {
    if (document.getElementById('__cursor')) return;
    const c = document.createElement('div'); c.id = '__cursor';
    c.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(30,26,22,.85);border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none;transition:transform .12s ease';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform = 'scale(.7)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = ''; }, true);
    const cap = document.createElement('div'); cap.id = '__caption';
    cap.style.cssText = 'position:fixed;z-index:99998;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);opacity:0;max-width:880px;padding:14px 22px;border-radius:999px;background:rgba(30,26,22,.92);color:#FBF8F3;font:500 17px/1.35 Inter,system-ui,sans-serif;box-shadow:0 18px 40px -12px rgba(0,0,0,.45);transition:all .45s cubic-bezier(.2,.7,.2,1);pointer-events:none;text-align:center';
    document.body.appendChild(cap);
    const saved = sessionStorage.getItem('__caption');
    if (saved) { cap.innerHTML = saved; cap.style.opacity = 1; cap.style.transform = 'translateX(-50%)'; }
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', mount) : mount();
})();`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const tmp = join(OUT, '.raw');
  rmSync(tmp, { recursive: true, force: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: tmp, size: { width: W, height: H } } });
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());

  const caption = async (html) => {
    await page.evaluate((h) => {
      sessionStorage.setItem('__caption', h);
      const c = document.getElementById('__caption'); if (!c) return;
      c.style.opacity = 0; c.style.transform = 'translateX(-50%) translateY(12px)';
      setTimeout(() => { c.innerHTML = h; c.style.opacity = 1; c.style.transform = 'translateX(-50%)'; }, 250);
    }, html);
    await wait(600);
  };
  let pos = { x: W / 2, y: H / 2 };
  const moveTo = async (loc) => {
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    const steps = Math.max(12, Math.round(Math.hypot(x - pos.x, y - pos.y) / 18));
    await page.mouse.move(x, y, { steps });
    pos = { x, y };
    await wait(180);
  };
  const click = async (loc, after = 700) => { await moveTo(loc); await page.mouse.down(); await wait(90); await page.mouse.up(); await wait(after); };
  const type = async (loc, text) => { await click(loc, 250); await loc.pressSequentially(text, { delay: 85 }); await wait(400); };
  const scroll = async (dy, ms = 1400) => {
    const n = Math.max(1, Math.round(ms / 40));
    for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy / n); await wait(40); }
    await wait(300);
  };

  // 1. Intent
  await page.goto(BASE + '/'); await wait(1600);
  await caption('<b>AROUND</b> · Your stay is just the beginning');
  await wait(1800);
  await caption('Travelers search a destination. Rome is the live demo city.');
  const dest = page.locator('input[role=combobox]').first();
  await type(dest, 'mad'); await wait(1200);
  await caption('Other cities show up as <b>coming soon</b>');
  await wait(1200);
  await dest.fill(''); await dest.pressSequentially('Rom', { delay: 90 }); await wait(700);
  await click(page.locator('[role=option]').first(), 600);
  await caption('One click loads the demo persona: a <b>30th birthday in Rome</b>, for two');
  await wait(1200);
  await click(page.getByRole('button', { name: 'Start demo →' }), 1800);

  // 2. Discovery
  await caption('Every stay is ranked by <b>Experience Match</b>: the trip you could have around it');
  await wait(1500);
  await scroll(520, 1600); await wait(1200);
  await scroll(-520, 900);
  await click(page.getByText('Terracotta Loft with a Glimpse of the Colosseum').first(), 2200);

  // 3. The wow moment
  await caption('<b>94% Experience Match</b>, with every reason explained');
  await scroll(560, 1400); await wait(2600);
  await caption('A map of what is around the door, scored for this traveler');
  await scroll(620, 1400); await wait(800);
  for (const item of await page.locator('ol li.cursor-pointer').all().then((a) => a.slice(0, 4))) { await moveTo(item); await wait(450); }
  await wait(600);
  await caption('A first draft of the trip, before the traveler even books');
  await scroll(720, 1400); await wait(2400);

  // 4. Book the stay
  await scroll(-3000, 1200);
  await caption('Booking the stay (mock payment, nothing is charged)');
  await click(page.getByRole('button', { name: 'Reserve' }), 900);
  await click(page.getByRole('button', { name: /Confirm and pay/ }), 1800);
  await click(page.locator('.fixed a', { hasText: 'Build my trip around this stay' }), 1500);

  // 5. AI planner
  await caption('The AI planner reads the request and the taste profile');
  await wait(1500);
  await click(page.getByRole('button', { name: /Build my trip/ }), 3200);
  await caption('A full itinerary: walking distances, budget, and a protected <b>birthday day</b>');
  await wait(1500);
  await scroll(700, 1800); await wait(900);
  await scroll(900, 1800); await wait(900);
  await scroll(-1600, 1200);

  // 6. Agent
  const input = page.locator('input[placeholder^="e.g."]');
  await caption('The traveler reshapes the trip in plain words');
  await type(input, 'Make my birthday more romantic');
  await page.keyboard.press('Enter'); await wait(2800);
  await caption('The agent edits the plan live and shows every change');
  await wait(1600);
  await type(input, 'I want to spend less than €400');
  await page.keyboard.press('Enter'); await wait(3000);
  await type(input, 'Replace the restaurant');
  await page.keyboard.press('Enter'); await wait(2200);
  await caption('Three ranked alternatives, swapped in with one click');
  await click(page.getByRole('button', { name: 'Swap in' }).first(), 2600);

  // 7. Bundle
  await caption('Everything bookable, in one checkout, with a <b>dynamic bundle discount</b>');
  await click(page.getByRole('link', { name: /Bundle & save|Book experience bundle/ }).first(), 2000);
  const box = page.locator('input[type=checkbox]').first();
  await click(box, 900); await click(box, 1200);
  await click(page.getByRole('button', { name: 'Book experience bundle' }), 2600);
  await caption('Stay + experiences: <b>higher marketplace GMV</b> per traveler');
  await wait(2800);

  // 8. Preference learning
  await page.goto(BASE + '/experiences'); await wait(1600);
  await caption('Every click, save and dismiss teaches the taste profile');
  const card = page.locator('article').nth(2);
  await moveTo(card); await wait(500);
  await click(card.getByRole('button', { name: 'Not for me' }), 1800);
  await click(page.locator('article').first().getByRole('button', { name: 'Save' }), 2200);

  // 9. Business view
  await page.goto(BASE + '/admin/analytics'); await wait(2200);
  await caption('The business view: conversion, attach rate, bundles, GMV (simulated, all hypotheses)');
  await scroll(650, 2200); await wait(1800);
  await scroll(650, 2000); await wait(1600);

  await page.goto(BASE + '/concept'); await wait(1400);
  await caption('<b>AROUND</b> · an AI experience intelligence layer for travel marketplaces');
  await wait(3200);

  await ctx.close(); await browser.close();
  const raw = readdirSync(tmp).find((f) => f.endsWith('.webm'));
  renameSync(join(tmp, raw), join(OUT, 'around-demo.webm'));
  rmSync(tmp, { recursive: true, force: true });
  console.log(`Saved ${join(OUT, 'around-demo.webm')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

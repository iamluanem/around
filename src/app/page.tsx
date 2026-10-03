import { ButtonLink } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { SearchBar } from '@/features/accommodations/SearchBar';
import { DemoStart } from '@/features/traveler-profile/DemoStart';

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export default function Home() {
  return (
    <>
      <section className="wrap grid gap-12 pb-16 pt-12 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
        <div className="animate-fade-up">
          <div className="eyebrow mb-5">Experience intelligence for travel</div>
          <h1 className="text-balance text-[44px] font-medium leading-[0.98] sm:text-6xl lg:text-[76px]">
            Your stay is <em className="font-light text-terra">just the beginning.</em>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-500">
            Don’t just book where you’ll stay — discover what your stay can become. AROUND learns who you’re travelling with, why, and what you love — then ranks every stay by the trip you could have around it.
          </p>
          <div className="mt-9 max-w-[760px]"><SearchBar /></div>
          <DemoStart />
        </div>
        <div className="relative hidden h-[560px] lg:block">
          <Photo src={u('photo-1552832230-c0197dd311b5')} alt="Colosseum at dusk" className="absolute right-0 top-0 h-[360px] w-[300px] rounded-[32px]" />
          <Photo src={u('photo-1473093295043-cdd812d0e601')} alt="Fresh pasta" className="absolute left-0 top-28 h-[260px] w-[220px] rounded-[28px] shadow-lift" />
          <Photo src={u('photo-1510812431401-41d2bd2722f3')} alt="Wine tasting" className="absolute bottom-0 right-16 h-[220px] w-[260px] rounded-[28px] shadow-lift" />
          <div className="absolute bottom-16 left-6 w-[250px] animate-scale-in rounded-3xl bg-white p-5 shadow-lift" style={{ animationDelay: '.4s' }}>
            <div className="eyebrow">Terracotta Loft · Monti</div>
            <div className="mt-2 flex items-end gap-2"><span className="font-serif text-5xl font-medium text-olive">94%</span><span className="mb-1.5 text-sm text-ink-500">experience match</span></div>
            <p className="mt-2 text-[13px] leading-snug text-ink-500">Great match for food, wine and romantic experiences.</p>
          </div>
        </div>
      </section>

      <section className="border-y hairline bg-white/60">
        <div className="wrap grid gap-10 py-16 md:grid-cols-3">
          {[
            ['01', 'Tell us your taste', 'Six quick questions build a Travel Taste Profile: occasion, interests, style, budget, pace and how local you like it.'],
            ['02', 'See the trip, not just the room', 'Every stay gets an explainable Experience Match — what’s nearby, what fits your budget, how walkable your best picks are.'],
            ['03', 'Let the agent plan it', 'An AI planner builds your days, reshapes them by conversation, and bundles experiences into one checkout.'],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div className="font-serif text-5xl font-light text-terra/80">{n}</div>
              <h3 className="mt-3 text-2xl font-medium">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
        <div>
          <div className="eyebrow mb-2">For marketplace teams</div>
          <h2 className="max-w-2xl text-3xl font-medium sm:text-4xl">From room inventory to experience commerce — the business case in one page.</h2>
        </div>
        <ButtonLink href="/concept" variant="dark" size="lg">Read the concept →</ButtonLink>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Concept — AROUND' };

const FUNNEL = [
  ['Traveler intent', 'Destination, dates, guests', '/'],
  ['Preference discovery', 'Travel Taste Profile quiz', '/profile'],
  ['Accommodation discovery', 'Stays ranked by the trip around them', '/stays'],
  ['Experience Match', 'Explainable 0–100 score per stay', '/stays'],
  ['Accommodation booking', 'Reserve with match context', '/stays'],
  ['Personalised itinerary', 'AI planner, walking-distance aware', '/trip'],
  ['Experience booking', 'Book any stop in one tap', '/trip'],
  ['Bundle / cross-sell', 'Dynamic bundle discount', '/bundle'],
  ['Higher marketplace GMV', 'Stay + experiences per traveler', '/admin/analytics'],
];

const IMPACT = [
  ['Accommodation conversion', 'Showing what a stay unlocks reduces choice paralysis between similar listings.', 'A/B: match-ranked vs rating-ranked results; primary metric booking rate per search session.'],
  ['Experience attach rate', 'Experiences are discovered at the moment of highest intent — while choosing the stay.', 'Share of stay bookings with ≥1 experience within 7 days.'],
  ['Cross-sell & bundles', 'A planned itinerary turns individual impulse buys into one curated order.', 'Bundle take-rate and items per order vs single-experience checkout.'],
  ['GMV per traveler', 'Stay + experiences + reservable dining in one journey.', 'Total GMV per booking traveler, 30-day window.'],
  ['Engagement & retention', 'A living plan and an agent give reasons to return before and during the trip.', 'Return visits pre-trip; repeat bookings within 12 months.'],
  ['First-party preference data', 'Every click, save and dismiss sharpens a durable taste profile.', 'Profile completeness; offline lift of learned vs stated preferences.'],
];

export default function ConceptPage() {
  return (
    <div>
      <section className="wrap py-16 sm:py-24">
        <div className="eyebrow mb-4">Product concept · independent proof of concept</div>
        <h1 className="max-w-5xl text-balance text-5xl font-medium leading-[0.98] sm:text-7xl">An Experience Intelligence Layer <em className="font-light text-terra">for travel marketplaces.</em></h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">AROUND explores how a stays marketplace could turn accommodation discovery into experience discovery — and capture the commerce that follows.</p>
      </section>

      <section className="border-y hairline bg-white/60">
        <div className="wrap grid gap-12 py-16 md:grid-cols-3">
          {[
            ['Problem', 'Travelers choose where to stay without fully understanding what they can experience around the accommodation. Listings compete on photos, amenities and price — the trip itself is invisible.'],
            ['Opportunity', 'Connect accommodation discovery with personalised local experience discovery, at the moment of highest intent, and own the itinerary that follows the booking.'],
            ['Solution', 'An AI-powered Experience Intelligence Layer: a taste profile, an explainable Experience Match for every stay, an agentic planner and bundled experience checkout.'],
          ].map(([t, d], i) => (
            <div key={t}>
              <div className="font-serif text-6xl font-light text-terra/70">0{i + 1}</div>
              <h2 className="mt-3 text-3xl font-medium">{t}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap py-20">
        <div className="eyebrow mb-3">The funnel this demo makes visible</div>
        <h2 className="max-w-3xl text-4xl font-medium">From intent to GMV — every step is a working screen.</h2>
        <ol className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {FUNNEL.map(([t, d, href], i) => (
            <li key={t} className="relative">
              <a href={href} className="lift flex h-full flex-col rounded-3xl bg-white p-4 ring-1 ring-ink/5" style={{ background: `color-mix(in srgb, #C2532B ${4 + i * 6}%, white)` }}>
                <span className="font-serif text-2xl text-terra">{i + 1}</span>
                <span className="mt-2 text-[14px] font-semibold leading-snug">{t}</span>
                <span className="mt-1 text-[12px] leading-snug text-ink-500">{d}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ink text-sand-50">
        <div className="wrap grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terra-100">How it works</div>
            <h2 className="mt-3 text-4xl font-medium">Explainable by design</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-sand-300">The Experience Match is a deterministic weighted model — no black box, no random numbers. Each component is shown to the traveler as a reason, and logged for offline evaluation against conversion.</p>
            <pre className="mt-6 overflow-x-auto rounded-2xl bg-white/5 p-5 text-[12.5px] leading-relaxed text-sand-200">{`score = interest × 0.30
      + budget   × 0.20
      + location × 0.20
      + style    × 0.15
      + context  × 0.10
      + quality  × 0.05   → 0–100`}</pre>
          </div>
          <div className="space-y-3">
            {[
              ['Experience surfaces', 'Search · Stay page · Planner · Agent · Bundle checkout'],
              ['Agent & tools', 'searchExperiences · rankExperiences · getTravelerProfile · calculateDistance · checkBudget · buildItinerary · replaceExperience · createBundle'],
              ['Intelligence', 'Explainable recommendation engine · budget-aware itinerary optimiser · preference learning from interactions'],
              ['Providers', 'AIProvider (Mock / OpenAI) · MapsProvider · PaymentProvider — swappable behind interfaces'],
              ['Data', 'Travelers · profiles · stays · experiences · providers · interactions · itineraries · bundles · bookings'],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-2xl p-5 ring-1 ring-white/10" style={{ background: `rgba(194,83,43,${0.28 - i * 0.05})` }}>
                <div className="text-[13px] font-semibold">{t}</div>
                <div className="mt-1 text-[13px] text-sand-300">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-20">
        <div className="eyebrow mb-3">Expected business impact</div>
        <h2 className="max-w-3xl text-4xl font-medium">Hypotheses, not claims.</h2>
        <p className="mt-3 max-w-2xl text-ink-500">No real marketplace metrics are used or implied. Each lever below is a hypothesis paired with the experiment that would validate it. The demo dashboard runs a simulated cohort through the real engine to illustrate the measurement plan.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {IMPACT.map(([t, why, test], i) => (
            <div key={t} className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-widest text-terra">H{i + 1} · Hypothesis</span><span className="text-xl text-olive">↗</span></div>
              <h3 className="mt-3 text-2xl font-medium">{t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-700">{why}</p>
              <p className="mt-3 border-t hairline pt-3 text-[13px] text-ink-500"><b className="font-medium text-ink">Validate:</b> {test}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <ButtonLink href="/" size="lg">Try the 3-minute demo →</ButtonLink>
          <ButtonLink href="/admin/analytics" size="lg" variant="secondary">Open the demo dashboard</ButtonLink>
        </div>
        <p className="mt-10 text-[13px] text-ink-400">This project is an independent product concept and is not affiliated with Airbnb.</p>
      </section>
    </div>
  );
}

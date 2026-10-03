'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItineraryChange } from '@/domain/itinerary/builder';
import { EMPTY_CONSTRAINTS } from '@/domain/itinerary/builder';
import { DEMO_PROFILE } from '@/domain/persona';
import { learnAffinities } from '@/domain/recommendation/engine';
import type {
  Booking, Bundle, Interaction, InteractionType, Interest, Itinerary, ItineraryConstraints, TravelerProfile,
} from '@/domain/types';
import type { Alternative, ToolCall } from '@/providers/ai/types';
import { toast } from './toast';
import { INTEREST_LABEL } from '@/domain/labels';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  toolCalls?: ToolCall[];
  changes?: ItineraryChange[];
  alternatives?: { key: string; slotLabel: string; currentId: string; options: Alternative[] };
  bundle?: Bundle;
  suggestions?: string[];
}

export interface LearningEvent { tag: Interest; from: number; to: number; cause: InteractionType; at: number }

interface State {
  profile: TravelerProfile;
  profileCompleted: boolean;
  guests: number;
  selectedStayId: string | null;
  stayBooking: Booking | null;
  itinerary: Itinerary | null;
  constraints: ItineraryConstraints;
  narrative: string;
  bookings: Booking[];
  interactions: Interaction[];
  saved: string[];
  liked: string[];
  dismissed: string[];
  chat: ChatMessage[];
  learning: LearningEvent[];
  bundleExcluded: string[];

  setProfile(p: TravelerProfile, completed?: boolean): void;
  selectStay(id: string): void;
  track(type: InteractionType, targetType: Interaction['targetType'], targetId: string, tags?: Interest[], silent?: boolean): void;
  toggleSave(id: string, tags: Interest[]): void;
  toggleLike(id: string, tags: Interest[]): void;
  dismiss(id: string, tags: Interest[]): void;
  undismiss(id: string): void;
  setPlan(p: { itinerary?: Itinerary; constraints?: ItineraryConstraints; narrative?: string; profile?: TravelerProfile }): void;
  addBooking(b: Booking): void;
  pushChat(m: ChatMessage): void;
  toggleBundleItem(id: string): void;
  resetDemo(): void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initial = {
  profile: DEMO_PROFILE,
  profileCompleted: false,
  guests: 2,
  selectedStayId: null,
  stayBooking: null,
  itinerary: null,
  constraints: EMPTY_CONSTRAINTS,
  narrative: '',
  bookings: [],
  interactions: [],
  saved: [],
  liked: [],
  dismissed: [],
  chat: [],
  learning: [],
  bundleExcluded: [],
};

function report(items: Interaction[]) {
  if (typeof window === 'undefined') return;
  fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) }).catch(() => {});
}

export const useAround = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      setProfile: (profile, completed = true) => set({ profile, profileCompleted: completed || get().profileCompleted, itinerary: null, constraints: EMPTY_CONSTRAINTS, chat: [] }),

      selectStay: (id) => {
        if (get().selectedStayId !== id) set({ selectedStayId: id, itinerary: null, constraints: EMPTY_CONSTRAINTS, chat: [], bundleExcluded: [] });
      },

      track: (type, targetType, targetId, tags = [], silent = false) => {
        const it: Interaction = { id: uid(), type, targetType, targetId, tags, at: new Date().toISOString() };
        const s = get();
        const patch: Partial<State> = { interactions: [...s.interactions.slice(-400), it] };
        if (tags.length && type !== 'VIEW') {
          const { affinities, changes } = learnAffinities(s.profile, type, tags);
          if (changes.length) {
            patch.profile = { ...s.profile, affinities };
            patch.learning = [...s.learning.slice(-30), ...changes.map((c) => ({ ...c, cause: type, at: Date.now() }))];
            if (!silent) {
              const c = changes.sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))[0];
              toast(`${c.to > c.from ? '↑' : '↓'} ${INTEREST_LABEL[c.tag]} affinity ${c.from.toFixed(2)} → ${c.to.toFixed(2)}`, 'learning');
            }
          }
        }
        set(patch);
        report([it]);
      },

      toggleSave: (id, tags) => {
        const saved = get().saved.includes(id) ? get().saved.filter((x) => x !== id) : [...get().saved, id];
        set({ saved });
        if (saved.includes(id)) get().track('SAVE', 'experience', id, tags);
      },
      toggleLike: (id, tags) => {
        const liked = get().liked.includes(id) ? get().liked.filter((x) => x !== id) : [...get().liked, id];
        set({ liked });
        if (liked.includes(id)) get().track('LIKE', 'experience', id, tags);
      },
      dismiss: (id, tags) => {
        set({ dismissed: [...new Set([...get().dismissed, id])] });
        get().track('DISMISS', 'experience', id, tags);
      },
      undismiss: (id) => set({ dismissed: get().dismissed.filter((x) => x !== id) }),

      setPlan: ({ itinerary, constraints, narrative, profile }) =>
        set((s) => ({
          itinerary: itinerary ?? s.itinerary,
          constraints: constraints ?? s.constraints,
          narrative: narrative ?? s.narrative,
          profile: profile ?? s.profile,
        })),

      addBooking: (b) => {
        const s = get();
        const patch: Partial<State> = { bookings: [...s.bookings, b] };
        if (b.kind === 'stay') patch.stayBooking = b;
        if (s.itinerary && b.kind !== 'stay') {
          patch.itinerary = { ...s.itinerary, days: s.itinerary.days.map((d) => ({ ...d, items: d.items.map((i) => (b.refIds.includes(i.experienceId) ? { ...i, booked: true } : i)) })) };
        }
        set(patch);
        for (const id of b.refIds) get().track('BOOK', b.kind === 'stay' ? 'accommodation' : 'experience', id, [], true);
      },

      pushChat: (m) => set({ chat: [...get().chat, m] }),
      toggleBundleItem: (id) => set({ bundleExcluded: get().bundleExcluded.includes(id) ? get().bundleExcluded.filter((x) => x !== id) : [...get().bundleExcluded, id] }),
      resetDemo: () => set({ ...initial }),
    }),
    { name: 'around-v1', skipHydration: true },
  ),
);

export const bookedExperienceIds = (bookings: Booking[]) => bookings.filter((b) => b.kind !== 'stay').flatMap((b) => b.refIds);
export { uid };

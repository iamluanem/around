'use client';
import { create } from 'zustand';

export interface Toast { id: number; text: string; kind: 'info' | 'success' | 'learning' }
export const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }));

let n = 0;
export function toast(text: string, kind: Toast['kind'] = 'info') {
  const id = ++n;
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, kind }] }));
  setTimeout(() => useToasts.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
}

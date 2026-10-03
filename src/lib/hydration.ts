'use client';
import { useEffect, useState } from 'react';
import { useAround } from './store';

/** Persisted state lives in localStorage; render personalised UI only after rehydration. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const p = useAround.persist;
    if (!p) { setOk(true); return; }
    if (p.hasHydrated()) { setOk(true); return; }
    const unsub = p.onFinishHydration(() => setOk(true));
    p.rehydrate();
    return unsub;
  }, []);
  return ok;
}

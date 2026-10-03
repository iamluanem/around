'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Experience } from '@/domain/types';
import { Photo } from '@/components/ui/Photo';
import { Dots } from '@/components/ui/misc';
import { askAgent, usePlannerUI } from '@/features/itinerary/usePlanner';
import { useAround, type ChatMessage } from '@/lib/store';
import { cn, dayLabel, eur } from '@/lib/format';

function ToolTrace({ calls }: { calls: NonNullable<ChatMessage['toolCalls']> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-[11.5px] text-ink-400 hover:text-ink">
        <span className="font-mono">ƒ</span> Used {calls.length} tool{calls.length > 1 ? 's' : ''} {open ? '▾' : '▸'}
      </button>
      {open && (
        <ol className="mt-1.5 space-y-1 rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-sand-200">
          {calls.map((c, i) => <li key={i}><span className="text-terra-100">{c.tool}</span>() <span className="text-sand-300/70">→ {c.summary}</span></li>)}
        </ol>
      )}
    </div>
  );
}

function Message({ m, byId }: { m: ChatMessage; byId: (id: string) => Experience | undefined }) {
  if (m.role === 'user') return <div className="ml-auto max-w-[85%] animate-fade-up rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[14px] text-sand-50">{m.text}</div>;
  return (
    <div className="max-w-[95%] animate-fade-up">
      <div className="rounded-3xl rounded-bl-lg bg-white px-4 py-3 text-[14px] leading-relaxed ring-1 ring-ink/5">
        {m.text}
        {m.changes && m.changes.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t hairline pt-3 text-[12.5px]">
            {m.changes.slice(0, 8).map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-[86px] shrink-0 text-ink-400">{dayLabel(c.date, { day: 'numeric', month: 'short' })} · {c.time}</span>
                <span className="min-w-0">
                  {c.from && <span className="text-ink-400 line-through">{byId(c.from)?.name}</span>}
                  {c.from && c.to && <span className="mx-1 text-ink-400">→</span>}
                  {c.to ? <b className="font-medium">{byId(c.to)?.name}</b> : <span className="text-terra">removed</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {m.alternatives && (
          <div className="mt-3 space-y-2">
            {m.alternatives.options.map((o) => {
              const e = byId(o.experienceId);
              if (!e) return null;
              return (
                <div key={o.experienceId} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-2 pr-3 ring-1 ring-ink/5">
                  <Photo src={e.image} alt={e.name} className="h-14 w-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 text-[12.5px]">
                    <div className="truncate font-medium text-[13.5px]">{e.name}</div>
                    <div className="text-ink-500">{o.match.score}% · {e.price ? eur(e.price) : 'Free'} · {o.walkMinutes} min</div>
                    {o.notes.length > 0 && <div className="truncate text-olive">{o.notes.join(' · ')}</div>}
                  </div>
                  <button onClick={() => askAgent({ action: { type: 'swap', key: m.alternatives!.key, experienceId: e.id } }, `Swap in ${e.name}`)}
                    className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-sand-50 hover:bg-ink-700">Swap in</button>
                </div>
              );
            })}
          </div>
        )}
        {m.bundle && (
          <Link href="/bundle" className="mt-3 flex items-center justify-between rounded-2xl bg-terra-50 p-3 text-[13px] ring-1 ring-terra/20">
            <span><b>{m.bundle.name}</b> · {m.bundle.lines.length} experiences<br /><span className="text-ink-500 line-through">{eur(m.bundle.subtotal)}</span> <b className="text-terra">{eur(m.bundle.total)}</b></span>
            <span className="font-medium text-terra">Review →</span>
          </Link>
        )}
        {m.toolCalls && m.toolCalls.length > 0 && <ToolTrace calls={m.toolCalls} />}
      </div>
    </div>
  );
}

export function AgentPanel({ experiences, className }: { experiences: Experience[]; className?: string }) {
  const chat = useAround((s) => s.chat);
  const busy = usePlannerUI((s) => s.busy);
  const provider = usePlannerUI((s) => s.provider);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const byId = (id: string) => experiences.find((e) => e.id === id);
  const last = [...chat].reverse().find((m) => m.role === 'agent');
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [chat.length, busy]);

  const send = (msg: string) => { if (!msg.trim() || busy) return; setText(''); askAgent({ message: msg }); };

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-[28px] bg-sand-100 ring-1 ring-ink/5', className)}>
      <div className="flex items-center gap-3 border-b hairline bg-white/70 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terra text-white">✦</span>
        <div className="min-w-0">
          <div className="font-medium">AROUND concierge</div>
          <div className="text-[11.5px] text-ink-500">Agent · {provider === 'openai' ? 'OpenAI planner' : 'built-in planner'} · edits your plan live</div>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {chat.length === 0 && <p className="p-2 text-[13.5px] text-ink-500">Ask me to reshape your trip in plain words.</p>}
        {chat.map((m) => <Message key={m.id} m={m} byId={byId} />)}
        {busy && <div className="w-fit rounded-3xl bg-white px-4 py-3 text-ink-400 ring-1 ring-ink/5"><Dots /></div>}
        <div ref={end} />
      </div>
      <div className="border-t hairline bg-white/70 p-3">
        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {(last?.suggestions?.length ? last.suggestions : ['Make my birthday more romantic', "I don't like museums", 'I want to spend less than €400', 'Give me more local experiences', 'Replace the restaurant']).map((s) => (
            <button key={s} onClick={() => send(s)} disabled={!!busy} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] ring-1 ring-ink/10 transition hover:ring-ink/30 disabled:opacity-50">{s}</button>
          ))}
          <button onClick={() => send('Book it all as a bundle')} disabled={!!busy} className="shrink-0 rounded-full bg-terra-50 px-3 py-1.5 text-[12px] text-terra ring-1 ring-terra/20">Bundle everything</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Replace the dinner on my birthday" className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[14px] outline-none ring-1 ring-ink/10 focus:ring-ink/30" />
          <button type="submit" disabled={!!busy || !text.trim()} className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-sand-50 disabled:opacity-40">Send</button>
        </form>
      </div>
    </div>
  );
}

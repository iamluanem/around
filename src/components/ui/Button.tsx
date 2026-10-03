import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/format';

type Variant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'soft';
const V: Record<Variant, string> = {
  primary: 'bg-terra text-white hover:bg-terra-600 shadow-[0_6px_20px_-8px_rgba(194,83,43,.7)]',
  dark: 'bg-ink text-sand-50 hover:bg-ink-700',
  secondary: 'bg-white text-ink ring-1 ring-ink/15 hover:ring-ink/30',
  ghost: 'text-ink hover:bg-ink/5',
  soft: 'bg-sand-100 text-ink hover:bg-sand-200',
};
const S = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-14 px-7 text-[15px]' };

interface Base { variant?: Variant; size?: keyof typeof S; className?: string; children: ReactNode }

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Base & ComponentProps<'button'>) {
  return (
    <button {...rest} className={cn('inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50', V[variant], S[size], className)}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = 'primary', size = 'md', className, children, href, ...rest }: Base & { href: string } & Omit<ComponentProps<typeof Link>, 'href'>) {
  return (
    <Link href={href} {...rest} className={cn('inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[.98]', V[variant], S[size], className)}>
      {children}
    </Link>
  );
}

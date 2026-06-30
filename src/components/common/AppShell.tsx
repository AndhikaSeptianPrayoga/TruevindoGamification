import type { PropsWithChildren, ReactNode } from 'react'
import { SoundToggle } from '@/components/common/SoundToggle'
import gimflyLogo from '@/assets/Img/Gimfly Academy White.png'
import truevindoLogo from '@/assets/Img/Truevindo-Logo_White.png'

interface AppShellProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
  aside?: ReactNode
}

export function AppShell({
  eyebrow,
  title,
  description,
  aside,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-corporate text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/5 px-6 py-6 shadow-panel backdrop-blur xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">{description}</p>
          </div>
          {aside ? <div className="w-full xl:max-w-md">{aside}</div> : null}
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-4 flex flex-col items-center gap-4 border-t border-white/10 pt-6 pb-2">
          <div className="flex items-center gap-8">
            <img
              src={truevindoLogo}
              alt="Truevindo"
              className="h-10 w-auto object-contain opacity-90 md:h-12"
            />
            <span className="h-8 w-px bg-white/15" aria-hidden />
            <img
              src={gimflyLogo}
              alt="Gimfly Studio"
              className="h-10 w-auto object-contain opacity-90 md:h-12"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Powered by Truevindo &amp; Gimfly Studio
          </p>
        </footer>
      </div>
      <SoundToggle />
    </div>
  )
}

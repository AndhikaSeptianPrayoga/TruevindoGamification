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
    <div className="page-shell min-h-screen bg-corporate text-ink">
      <div className="hero-orb hero-orb-red absolute left-[-8rem] top-[-4rem] h-72 w-72" />
      <div className="hero-orb hero-orb-blue absolute right-[-7rem] top-20 h-80 w-80" />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="panel-elevated relative flex flex-col gap-8 px-6 py-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="kicker">{eyebrow}</p>
              <span className="pill-tag">Professional Tech Experience</span>
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-700 md:text-base">{description}</p>
          </div>
          {aside ? <div className="w-full xl:max-w-md">{aside}</div> : null}
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-2 flex flex-col items-center gap-4 pb-2">
          <div className="panel-dark flex items-center gap-6 px-5 py-4">
            <img src={truevindoLogo} alt="Truevindo" className="h-8 w-auto object-contain md:h-10" />
            <span className="h-8 w-px bg-white/15" aria-hidden />
            <img src={gimflyLogo} alt="Gimfly Studio" className="h-8 w-auto object-contain md:h-10" />
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
            Future-ready experience by Truevindo &amp; Gimfly Studio
          </p>
        </footer>
      </div>
      <SoundToggle />
    </div>
  )
}

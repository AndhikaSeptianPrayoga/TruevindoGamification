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
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-10">
        <header className="panel-elevated relative flex flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="kicker">{eyebrow}</p>
              <span className="pill-tag">Professional Tech Experience</span>
            </div>
            <h1 className="max-w-3xl font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-700 md:text-base">{description}</p>
          </div>
          {aside ? <div className="w-full xl:max-w-md">{aside}</div> : null}
        </header>
        <main className="flex-1">{children}</main>
        <footer className="relative mt-2 flex flex-col items-center gap-4 overflow-hidden rounded-[32px] border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-5 shadow-[0_28px_80px_rgba(2,6,23,0.34)] sm:px-6 sm:py-6">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="w-full max-w-xl rounded-[28px] border border-white/12 bg-black/55 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.28)] sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <img src={truevindoLogo} alt="Truevindo" className="h-8 w-auto object-contain sm:h-9 md:h-11" />
            <span className="hidden h-9 w-px bg-white/20 sm:block" aria-hidden />
            <img src={gimflyLogo} alt="Gimfly Studio" className="h-8 w-auto object-contain sm:h-9 md:h-11" />
            </div>
          </div>
          <p className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-100/90 sm:text-xs sm:tracking-[0.25em]">
            Future-ready experience by Truevindo &amp; Gimfly Studio
          </p>
        </footer>
      </div>
      <SoundToggle />
    </div>
  )
}

import type { PropsWithChildren, ReactNode } from 'react'
import { SoundToggle } from '@/components/common/SoundToggle'
import gimflyLogo from '@/assets/Img/Gimfly Academy White.png'
import hondaDigiconLogo from '@/assets/Img/HONDA DIGICON 2026.png'
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
    <div className="page-shell min-h-screen text-ink">
      <div className="hero-orb hero-orb-red absolute left-[-8rem] top-[-4rem] h-72 w-72" />
      <div className="hero-orb hero-orb-blue absolute right-[-7rem] top-20 h-80 w-80" />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:px-10">
        {/* Event masthead — centered, consistent size on every page (per the
            DIGICON reference, the brand sits top-center above all content). */}
        <div className="flex justify-center pt-1">
          <img
            src={hondaDigiconLogo}
            alt="Honda DIGICON 2026"
            className="h-16 w-auto object-contain drop-shadow-sm sm:h-20 md:h-24"
          />
        </div>
        <header className="panel-elevated relative flex flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 xl:flex-row xl:items-end xl:justify-between">
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

        {/* DIGICON-style closing band: red → violet → blue gradient with pixel accents. */}
        <footer className="relative mt-2 overflow-hidden rounded-[32px] bg-gradient-to-r from-[#e2242f] via-[#7c3aed] to-[#1d4ed8] px-4 py-8 shadow-[0_28px_80px_rgba(29,78,216,0.28)] sm:px-6">
          <span aria-hidden className="absolute left-6 top-5 h-2 w-2 bg-white/50" />
          <span aria-hidden className="absolute left-12 top-9 h-1.5 w-1.5 bg-white/30" />
          <span aria-hidden className="absolute right-8 top-6 h-2 w-2 bg-white/40" />
          <span aria-hidden className="absolute bottom-6 left-10 h-1.5 w-1.5 bg-white/30" />
          <span aria-hidden className="absolute bottom-5 right-14 h-2 w-2 bg-white/50" />
          <span aria-hidden className="absolute bottom-9 right-6 h-1.5 w-1.5 bg-white/30" />

          <div className="flex flex-col items-center gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80">
              Honda DIGICON 2026
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <img src={truevindoLogo} alt="Truevindo" className="h-8 w-auto object-contain sm:h-9 md:h-11" />
              <img src={gimflyLogo} alt="Gimfly Studio" className="h-8 w-auto object-contain sm:h-9 md:h-11" />
            </div>
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-white/90 sm:text-xs sm:tracking-[0.25em]">
              Future-ready experience by Truevindo &amp; Gimfly Studio
            </p>
          </div>
        </footer>
      </div>
      <SoundToggle />
    </div>
  )
}

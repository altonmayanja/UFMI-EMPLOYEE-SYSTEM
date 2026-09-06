'use client'

import { BarChart3, CheckCircle2, ClipboardCheck, FileText, ShieldCheck, UsersRound } from 'lucide-react'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Natural%20Intellects%20LTD%20LOGO-kW8y0UnJCLLYKZinLc70NoJI9YPSup.png'

export function AuthVisualPanel() {
  return (
    <section className="auth-visual-panel relative hidden min-h-screen overflow-hidden bg-[#121d18] p-10 text-[#f4f1e8] lg:flex lg:w-[52%] lg:flex-col lg:justify-between xl:p-14" aria-label="Natural Intellects platform preview">
      <div className="auth-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Natural Intellects Ltd" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="font-serif text-lg leading-none">Natural Intellects</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#c4d0c5]">Employee systems</p>
          </div>
        </div>
        <p className="mt-20 max-w-xl text-xs font-semibold uppercase tracking-[0.25em] text-[#e9b44c]">Workforce clarity, built in</p>
        <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em] text-balance xl:text-6xl">Turn everyday work into a clearer operating picture.</h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-[#c4d0c5]">Capture employee activity, understand reporting health, and give managers the evidence they need to move work forward.</p>
      </div>

      <div className="auth-float relative z-10 mx-auto mt-12 w-full max-w-xl" aria-label="Example organization overview">
        <div className="border border-[#486454] bg-[#1b2a22]/95 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-[#385343] pb-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#9ab0a0]">Organization overview</p><p className="mt-1 font-semibold">Reporting rhythm</p></div><span className="flex items-center gap-1.5 text-xs text-[#b8d88f]"><span className="h-2 w-2 rounded-full bg-[#b8d88f]" /> Live</span></div>
          <div className="grid grid-cols-3 gap-3 py-5"><div><UsersRound className="h-4 w-4 text-[#e9b44c]" /><p className="mt-3 text-2xl font-semibold">42</p><p className="text-[11px] text-[#9ab0a0]">Employees</p></div><div><ClipboardCheck className="h-4 w-4 text-[#e9b44c]" /><p className="mt-3 text-2xl font-semibold">94%</p><p className="text-[11px] text-[#9ab0a0]">Reporting health</p></div><div><BarChart3 className="h-4 w-4 text-[#e9b44c]" /><p className="mt-3 text-2xl font-semibold">126</p><p className="text-[11px] text-[#9ab0a0]">Activities</p></div></div>
          <div className="flex items-end gap-1 border-t border-[#385343] pt-4">{[30, 45, 38, 58, 50, 68, 62, 80, 73, 91].map((height, index) => <span key={height} className="auth-bar flex-1 bg-[#e9b44c]" style={{ height: `${height}px`, animationDelay: `${index * 70}ms`, opacity: index === 9 ? 1 : 0.45 }} />)}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#b8d88f]"><CheckCircle2 className="h-4 w-4" /> Monthly insight ready for review</div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-5 border-t border-[#385343] pt-5 text-xs text-[#9ab0a0]"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#e9b44c]" /> Tenant-aware access</span><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#e9b44c]" /> Structured reports</span></div>
    </section>
  )
}

export { logoUrl }

'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ClipboardCheck,
  FileSpreadsheet,
  Headphones,
  LockKeyhole,
  Menu,
  Mic,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'

const features = [
  { icon: ClipboardCheck, title: 'Daily work reporting', text: 'Give every employee a clear, low-friction place to capture meaningful work as it happens.' },
  { icon: BarChart3, title: 'Management visibility', text: 'See submission health, recurring work, and team activity without chasing spreadsheets.' },
  { icon: Sparkles, title: 'Report Intelligence', text: 'Turn submitted activity into structured summaries, categories, and evidence-based insights.' },
  { icon: BellRing, title: 'Automated reminders', text: 'Keep reporting consistent with organization-aware reminders that respect local working hours.' },
  { icon: FileSpreadsheet, title: 'Excel-ready exports', text: 'Export decision-ready monthly workbooks with summaries, statistics, activities, and notes.' },
  { icon: Mic, title: 'Voice-to-text input', text: 'Capture a thought quickly, review it, then submit it as a polished daily activity entry.' },
]

const plans = [
  { name: 'Starter', price: 'UGX 30,000', limit: 'Up to 10 employees', description: 'A focused foundation for small teams.' },
  { name: 'Business', price: 'UGX 75,000', limit: 'Up to 30 employees', description: 'More visibility for growing organizations.', featured: true },
  { name: 'Professional', price: 'UGX 150,000', limit: 'Up to 75 employees', description: 'Reporting depth for established teams.' },
  { name: 'Enterprise', price: 'Custom', limit: '75+ employees', description: 'A plan shaped around your operating model.' },
]

export default function MarketingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f3] text-[#17211b]">
      <header className="relative z-20 border-b border-[#dfe5dc] bg-[#f7f7f3]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/marketing" className="flex items-center gap-3" aria-label="Natural Intellects home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173b2b] text-[#e9b44c]"><Network className="h-5 w-5" /></span>
            <span><span className="block text-sm font-semibold tracking-[0.18em] text-[#173b2b]">NATURAL</span><span className="block text-sm font-semibold tracking-[0.18em] text-[#173b2b]">INTELLECTS</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#526158] lg:flex" aria-label="Primary navigation">
            <a href="#features" className="transition-colors hover:text-[#173b2b]">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-[#173b2b]">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-[#173b2b]">Pricing</a>
            <a href="#security" className="transition-colors hover:text-[#173b2b]">Security</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex"><Link href="/" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#173b2b] hover:bg-[#e8eee5]">Log in</Link><Link href="/marketing/start-free-trial" className="rounded-full bg-[#173b2b] px-5 py-2.5 text-sm font-semibold text-[#f7f7f3] shadow-sm transition-transform hover:-translate-y-0.5">Start free trial <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div>
          <button type="button" className="rounded-lg p-2 lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-[#dfe5dc] px-5 py-5 text-sm lg:hidden"><a href="#features" onClick={() => setMenuOpen(false)}>Features</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a><Link href="/marketing/start-free-trial" className="font-semibold text-[#173b2b]">Start free trial <ArrowRight className="ml-1 inline h-4 w-4" /></Link></nav>}
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div><p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#b2761b]"><span className="h-px w-8 bg-[#b2761b]" /> Workforce clarity, built in</p><h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#173b2b] sm:text-6xl lg:text-7xl">Make every day of work <span className="text-[#b2761b]">visible.</span></h1><p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-[#526158]">Natural Intellects turns daily employee activity into structured reports, management visibility, and actionable workforce insight.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/marketing/start-free-trial" className="inline-flex items-center justify-center rounded-full bg-[#b2761b] px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link><a href="#features" className="inline-flex items-center justify-center rounded-full border border-[#c8d2c7] px-6 py-3.5 text-sm font-semibold text-[#173b2b] hover:bg-[#edf1eb]">Explore the platform</a></div><p className="mt-5 text-xs text-[#738078]">14-day trial · No payment required · Built for distributed teams</p></div>
        <div className="relative"><div className="absolute -inset-8 -z-10 rounded-full bg-[#e8eee5] blur-3xl" /><div className="rounded-[2rem] border border-[#cbd6cb] bg-[#173b2b] p-4 shadow-2xl shadow-[#173b2b]/15 sm:p-6"><div className="rounded-[1.25rem] bg-[#f7f7f3] p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#829086]">Organization overview</p><h2 className="mt-2 text-xl font-semibold text-[#173b2b]">Good morning, team</h2></div><span className="rounded-full bg-[#e8eee5] px-3 py-1 text-xs font-medium text-[#356247]">Live view</span></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#e8eee5] p-4"><UsersRound className="h-4 w-4 text-[#356247]" /><p className="mt-5 text-2xl font-semibold text-[#173b2b]">42</p><p className="mt-1 text-xs text-[#65746a]">Active employees</p></div><div className="rounded-xl bg-[#fbf0dc] p-4"><BarChart3 className="h-4 w-4 text-[#b2761b]" /><p className="mt-5 text-2xl font-semibold text-[#173b2b]">94%</p><p className="mt-1 text-xs text-[#65746a]">Reporting health</p></div><div className="col-span-2 rounded-xl border border-[#dfe5dc] p-4 sm:col-span-1"><p className="text-xs font-semibold text-[#65746a]">This month</p><div className="mt-4 flex h-12 items-end gap-1.5">{[32, 47, 39, 60, 52, 72, 66, 85, 76, 92].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#b2761b]" style={{ height: `${height}%`, opacity: index === 9 ? 1 : .55 }} />)}</div></div></div><div className="mt-4 rounded-xl border border-[#dfe5dc] p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#173b2b]">Recent activity</p><span className="text-xs text-[#829086]">Today</span></div><div className="mt-4 space-y-3">{['Field operations report submitted', 'Monthly summary generated', 'Reminder schedule completed'].map((item, index) => <div key={item} className="flex items-center gap-3 text-xs text-[#65746a]"><span className={`h-2 w-2 rounded-full ${index === 1 ? 'bg-[#b2761b]' : 'bg-[#6f9b7b]'}`} />{item}<span className="ml-auto text-[#a1aca3]">{index + 1}h</span></div>)}</div></div></div></div></div>
      </section>

      <section id="features" className="border-y border-[#dfe5dc] bg-[#edf1eb] px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b2761b]">A calmer operating rhythm</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#173b2b] sm:text-5xl">Everything your team needs to report clearly and manage confidently.</h2></div><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#d2ddd2] bg-[#d2ddd2] sm:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="bg-[#edf1eb] p-7 transition-colors hover:bg-[#f7f7f3]"><Icon className="h-5 w-5 text-[#b2761b]" /><h3 className="mt-8 text-lg font-semibold text-[#173b2b]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#65746a]">{text}</p></article>)}</div></div></section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b2761b]">How it works</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#173b2b]">From a daily note to a useful management signal.</h2><p className="mt-5 leading-7 text-[#65746a]">A simple workflow that respects the people doing the work and gives leaders the context they need.</p></div><div className="grid gap-3 sm:grid-cols-2">{['Create your organization', 'Add employees and teams', 'Capture daily activity', 'Monitor reporting health', 'Generate monthly insight', 'Review, share, and export'].map((step, index) => <div key={step} className="flex items-center gap-4 rounded-xl border border-[#dfe5dc] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173b2b] text-sm font-semibold text-[#f7f7f3]">{index + 1}</span><span className="text-sm font-semibold text-[#304237]">{step}</span></div>)}</div></div></section>

      <section id="security" className="bg-[#173b2b] px-5 py-20 text-[#f7f7f3] lg:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e9b44c]">Built with care</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Your workforce data deserves a considered home.</h2><p className="mt-5 max-w-xl leading-7 text-[#c4d0c5]">Tenant-aware access, role-based permissions, secure authentication, and auditable activity are foundational—not add-ons.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['Tenant isolation', 'Customer data is scoped server-side to its organization.'], ['Role-based access', 'Permissions follow responsibility, not guesswork.'], ['Audit logging', 'Important actions leave a clear, reviewable trail.'], ['Responsible exports', 'Reports respect ownership and organization boundaries.']].map(([title, text]) => <div key={title} className="rounded-xl border border-[#3d5c49] p-5"><ShieldCheck className="h-5 w-5 text-[#e9b44c]" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#b6c5b8]">{text}</p></div>)}</div></div></section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b2761b]">Simple starting points</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#173b2b]">Choose the shape that fits your team.</h2></div><p className="max-w-sm text-sm leading-6 text-[#65746a]">Plans are configurable so Natural Intellects can evolve limits, features, and billing intervals as your organization grows.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-4">{plans.map((plan) => <article key={plan.name} className={`flex flex-col rounded-2xl border p-6 ${plan.featured ? 'border-[#b2761b] bg-[#fbf0dc]' : 'border-[#dfe5dc] bg-[#f7f7f3]'}`}><div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-[#173b2b]">{plan.name}</h3>{plan.featured && <span className="rounded-full bg-[#b2761b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Popular</span>}</div><p className="mt-6 text-2xl font-semibold text-[#173b2b]">{plan.price}<span className="text-sm font-normal text-[#829086]"> / month</span></p><p className="mt-2 text-sm text-[#65746a]">{plan.limit}</p><p className="mt-6 min-h-12 text-sm leading-6 text-[#65746a]">{plan.description}</p><Link href="/marketing/start-free-trial" className="mt-6 inline-flex items-center text-sm font-semibold text-[#173b2b]">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link></article>)}</div></section>

      <section className="mx-5 mb-16 rounded-[2rem] bg-[#e8eee5] px-6 py-14 text-center lg:mx-auto lg:max-w-7xl lg:px-8"><LockKeyhole className="mx-auto h-6 w-6 text-[#b2761b]" /><h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[#173b2b]">Give your people less admin and your leaders more signal.</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-[#65746a]">Start with a 14-day trial and see how a clearer reporting rhythm changes the way your organization operates.</p><Link href="/marketing/start-free-trial" className="mt-8 inline-flex rounded-full bg-[#173b2b] px-6 py-3.5 text-sm font-semibold text-[#f7f7f3]">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link></section>

      <footer className="border-t border-[#dfe5dc] px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#738078] sm:flex-row"><p>© {new Date().getFullYear()} Natural Intellects Ltd.</p><div className="flex gap-5"><a href="#security" className="hover:text-[#173b2b]">Security</a><a href="#pricing" className="hover:text-[#173b2b]">Pricing</a><a href="mailto:hello@naturalintellects.com" className="hover:text-[#173b2b]">Contact</a><span className="flex items-center gap-1"><Headphones className="h-3.5 w-3.5" /> Support-ready</span></div></div></footer>
    </main>
  )
}

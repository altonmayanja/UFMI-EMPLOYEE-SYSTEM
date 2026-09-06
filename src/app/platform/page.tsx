'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, FileText, CreditCard, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react'

type Overview = { metrics: Record<string, number>; organizations: { id: string; name: string; slug: string; status: string; createdAt: string; trialEndsAt: string | null; subscription: { status: string; plan: { name: string } } | null; _count: { users: number } }[] }

export default function PlatformPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const response = await fetch('/api/platform/overview', { credentials: 'include' })
    if (!response.ok) { setError(response.status === 403 ? 'This area is restricted to Natural Intellects platform administrators.' : 'Sign in with a platform administrator account to continue.'); setLoading(false); return }
    setData(await response.json()); setError(''); setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  if (loading) return <main className="min-h-screen bg-[#101413] p-8 text-[#f4f1e8]"><p>Loading Control Center...</p></main>
  if (error) return <main className="flex min-h-screen items-center justify-center bg-[#101413] p-6 text-[#f4f1e8]"><div className="max-w-md border border-[#343d38] bg-[#171d1a] p-8"><ShieldAlert className="mb-5 h-7 w-7 text-[#ef4b3f]" /><h1 className="text-2xl font-semibold">Access restricted</h1><p className="mt-3 text-sm leading-6 text-[#aeb8b0]">{error}</p><Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#ef4b3f]">Go to login <ArrowLeft className="h-4 w-4" /></Link></div></main>

  const cards = [{ label: 'Organizations', value: data?.metrics.organizations, icon: Building2 }, { label: 'Active employees', value: data?.metrics.employees, icon: Users }, { label: 'Active trials', value: data?.metrics.trials, icon: CreditCard }, { label: 'Reports generated', value: data?.metrics.reports, icon: FileText }]
  return <main className="min-h-screen bg-[#101413] text-[#f4f1e8]"><header className="border-b border-[#343d38] bg-[#171d1a]"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ef4b3f]">Natural Intellects</p><h1 className="mt-1 text-xl font-semibold">Control Center</h1></div><button onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 border border-[#465149] px-4 text-sm hover:bg-[#222b26]"><RefreshCw className="h-4 w-4" /> Refresh</button></div></header><div className="mx-auto max-w-7xl px-6 py-10"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="border border-[#343d38] bg-[#171d1a] p-5"><Icon className="h-5 w-5 text-[#ef4b3f]" /><p className="mt-7 text-3xl font-semibold">{value ?? 0}</p><p className="mt-2 text-sm text-[#aeb8b0]">{label}</p></div>)}</div><section className="mt-10 border border-[#343d38] bg-[#171d1a]"><div className="flex items-center justify-between border-b border-[#343d38] px-5 py-4"><div><h2 className="font-semibold">Organizations</h2><p className="mt-1 text-sm text-[#aeb8b0]">Control-plane visibility without unrestricted customer report access.</p></div><span className="text-xs uppercase tracking-widest text-[#ef4b3f]">Live data</span></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-[#7f8b82]"><tr><th className="px-5 py-4">Organization</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Users</th><th className="px-5 py-4">Lifecycle</th><th className="px-5 py-4">Created</th></tr></thead><tbody>{data?.organizations.map((organization) => <tr key={organization.id} className="border-t border-[#343d38]"><td className="px-5 py-4"><p className="font-medium">{organization.name}</p><p className="text-xs text-[#7f8b82]">{organization.slug}</p></td><td className="px-5 py-4">{organization.subscription?.plan.name ?? 'Unassigned'}</td><td className="px-5 py-4">{organization._count.users}</td><td className="px-5 py-4"><span className="border border-[#465149] px-2 py-1 text-xs">{organization.status}</span></td><td className="px-5 py-4 text-[#aeb8b0]">{new Date(organization.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{data?.organizations.length === 0 && <p className="p-8 text-sm text-[#aeb8b0]">No organizations have been created yet.</p>}</div></section></div></main>
}

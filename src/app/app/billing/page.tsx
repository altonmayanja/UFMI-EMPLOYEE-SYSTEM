'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CreditCard, LockKeyhole, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type BillingData = {
  subscription: {
    status: string
    provider: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    plan: { name: string; key: string; monthlyPrice: number; maxEmployees: number | null }
  } | null
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = window.localStorage.getItem('ufmi_token')
    fetch('/api/billing', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load billing details')
        return response.json() as Promise<BillingData>
      })
      .then(setData)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  async function requestCheckout() {
    const token = window.localStorage.getItem('ufmi_token')
    if (!data?.subscription) return
    const response = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ planKey: data.subscription.plan.key }),
    })
    const result = await response.json()
    setMessage(result.error ?? 'Checkout request completed')
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/app" className="mb-10 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to workspace
        </Link>
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#ed1c24]">Natural Intellects</p>
            <h1 className="text-4xl font-semibold tracking-tight">Billing & subscription</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">Manage your organization plan, billing status, and employee capacity from one secure workspace.</p>
          </div>
          <CreditCard className="h-8 w-8 text-[#ed1c24]" aria-hidden="true" />
        </div>
        {loading ? <div className="flex items-center gap-3 text-white/60"><RefreshCw className="h-4 w-4 animate-spin" /> Loading subscription</div> : data?.subscription ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-sm text-white/50">Current plan</p>
                <h2 className="mt-2 text-2xl font-semibold">{data.subscription.plan.name}</h2>
                <p className="mt-2 text-sm capitalize text-white/60">{data.subscription.status} · {data.subscription.plan.maxEmployees ?? 'Unlimited'} employees</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold">{data.subscription.plan.monthlyPrice === 0 ? 'Free' : `$${data.subscription.plan.monthlyPrice / 100}/mo`}</p>
                {data.subscription.currentPeriodEnd && <p className="mt-2 text-xs text-white/45">Renews {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              <button onClick={requestCheckout} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#ed1c24] px-5 text-sm font-semibold transition hover:bg-[#ff3038]"> <CreditCard className="h-4 w-4" /> Manage plan</button>
              <span className="inline-flex items-center gap-2 text-xs text-white/45"><LockKeyhole className="h-3.5 w-3.5" /> Provider checkout required before charging</span>
            </div>
          </section>
        ) : <p className="rounded-xl border border-white/10 p-6 text-white/60">No subscription is attached to this organization yet.</p>}
        {message && <p role="status" className="mt-5 rounded-lg border border-[#ed1c24]/30 bg-[#ed1c24]/10 p-4 text-sm text-white/80">{message}</p>}
      </div>
    </main>
  )
}

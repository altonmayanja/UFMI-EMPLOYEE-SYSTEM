import { NextResponse } from 'next/server'
import { ensureDefaultPlans, DEFAULT_PLANS } from '@/lib/entitlements'
import { db } from '@/lib/db'

export async function GET() {
  await ensureDefaultPlans()
  const plans = await db.plan.findMany({ where: { active: true }, orderBy: { monthlyPrice: 'asc' } })
  return NextResponse.json({ plans: plans.map((plan) => ({ ...plan, monthlyPrice: plan.monthlyPrice, annualPrice: Math.round(plan.monthlyPrice * 10.8), entitlements: JSON.parse(plan.entitlements) })) })
}

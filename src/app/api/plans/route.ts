import { NextResponse } from 'next/server'
import { DEFAULT_PLANS } from '@/lib/entitlements'

export async function GET() {
  return NextResponse.json({ plans: DEFAULT_PLANS.map((plan) => ({ ...plan, monthlyPrice: plan.monthlyPrice / 100 })) })
}

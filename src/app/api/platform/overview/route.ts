import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest, forbiddenResponse, unauthorizedResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const payload = await authenticateRequest(request)
  if (!payload) return unauthorizedResponse()
  if (payload.role !== 'super_admin') return forbiddenResponse('Natural Intellects platform administrator access required')

  const [organizations, activeOrganizations, trials, subscriptions, suspended, employees, reports, recent] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { status: { in: ['trial', 'active', 'grace'] } } }),
    db.organization.count({ where: { status: { in: ['trial', 'grace'] } } }),
    db.subscription.count({ where: { status: { in: ['active', 'trialing'] } } }),
    db.organization.count({ where: { status: 'suspended' } }),
    db.user.count({ where: { status: 'active' } }),
    db.dailyReport.count(),
    db.organization.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, name: true, slug: true, status: true, createdAt: true, trialEndsAt: true, subscription: { select: { status: true, plan: { select: { name: true } } } }, _count: { select: { users: true } } } }),
  ])

  return NextResponse.json({ metrics: { organizations, activeOrganizations, trials, subscriptions, suspended, employees, reports }, organizations: recent })
}

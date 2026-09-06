import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireOrganizationAdmin, recordAuditEvent } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const payload = await authenticateRequest(request)
  const { context, response } = await requireOrganizationAdmin(payload)
  if (!context) return response

  const subscription = await db.subscription.findUnique({
    where: { organizationId: context.organizationId },
    include: { plan: true },
  })

  return NextResponse.json({
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          provider: subscription.provider,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          plan: subscription.plan,
        }
      : null,
  })
}

export async function POST(request: NextRequest) {
  const payload = await authenticateRequest(request)
  const { context, response } = await requireOrganizationAdmin(payload)
  if (!context) return response

  const body = await request.json().catch(() => null)
  const planKey = typeof body?.planKey === 'string' ? body.planKey : null
  if (!planKey) return NextResponse.json({ error: 'A plan is required' }, { status: 400 })

  const plan = await db.plan.findFirst({ where: { key: planKey, active: true } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  await recordAuditEvent({
    organizationId: context.organizationId,
    actorUserId: context.userId,
    action: 'billing.checkout_requested',
    entityType: 'Plan',
    entityId: plan.id,
    metadata: { planKey: plan.key },
  })

  return NextResponse.json(
    { error: 'Billing provider checkout is not configured for this deployment' },
    { status: 503 },
  )
}

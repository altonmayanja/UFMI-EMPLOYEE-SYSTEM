import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireOrganizationAdmin, recordAuditEvent } from '@/lib/tenant'
import { syncOrganizationLifecycle } from '@/lib/lifecycle'
import { canAddEmployee, getEmployeeLimit } from '@/lib/entitlements'

export async function GET(request: NextRequest) {
  const payload = await authenticateRequest(request)
  const { context, response } = await requireOrganizationAdmin(payload)
  if (!context) return response

  const organization = await syncOrganizationLifecycle(context.organizationId)
  const subscription = await db.subscription.findUnique({
    where: { organizationId: context.organizationId },
    include: { plan: true },
  })
  const employeeCount = await db.user.count({ where: { organizationId: context.organizationId, role: 'employee', status: 'active' } })

  return NextResponse.json({
    organization: organization ? { id: organization.id, status: organization.status, trialStartedAt: organization.trialStartedAt, trialEndsAt: organization.trialEndsAt, graceEndsAt: organization.graceEndsAt } : null,
    usage: { employeeCount, employeeLimit: getEmployeeLimit(context.organizationId), canAddEmployee: await canAddEmployee(context.organizationId) },
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
  if (body?.action === 'cancel') {
    const subscription = await db.subscription.findUnique({ where: { organizationId: context.organizationId } })
    if (!subscription || subscription.status !== 'active') return NextResponse.json({ error: 'Only active paid subscriptions can be cancelled' }, { status: 409 })
    const updated = await db.subscription.update({ where: { id: subscription.id }, data: { cancelAtPeriodEnd: true } })
    await recordAuditEvent({ organizationId: context.organizationId, actorUserId: context.userId, action: 'SUBSCRIPTION_CANCELLED', entityType: 'Subscription', entityId: subscription.id, metadata: { effectiveAt: subscription.currentPeriodEnd } })
    return NextResponse.json({ subscription: updated })
  }

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

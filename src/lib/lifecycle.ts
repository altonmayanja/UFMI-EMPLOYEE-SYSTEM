import { db } from '@/lib/db'
import { recordAuditEvent } from '@/lib/tenant'

export async function createOrganization(input: { name: string; slug: string; ownerUserId: string; timezone?: string }) {
  const trialStartedAt = new Date()
  const trialEndsAt = new Date(trialStartedAt)
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)
  const starter = await db.plan.findUnique({ where: { key: 'starter' } })
  if (!starter) throw new Error('Default plans are not configured')
  const organization = await db.organization.create({ data: {
    name: input.name, slug: input.slug, timezone: input.timezone ?? 'Africa/Kampala', trialStartedAt, trialEndsAt,
    users: { connect: { id: input.ownerUserId } },
    members: { create: { userId: input.ownerUserId, role: 'owner' } },
    settings: { create: {} },
    subscription: { create: { planId: starter.id, status: 'trialing' } },
  } })
  await recordAuditEvent({ organizationId: organization.id, actorUserId: input.ownerUserId, action: 'organization_created' })
  return organization
}

export async function syncOrganizationLifecycle(organizationId: string) {
  const organization = await db.organization.findUnique({ where: { id: organizationId }, include: { subscription: true } })
  if (!organization || organization.status === 'archived') return organization
  const now = new Date()
  if (organization.status === 'trial' && organization.trialEndsAt && now > organization.trialEndsAt) {
    const graceEndsAt = new Date(organization.trialEndsAt)
    graceEndsAt.setDate(graceEndsAt.getDate() + 7)
    const status = now > graceEndsAt ? 'suspended' : 'grace'
    return db.organization.update({ where: { id: organizationId }, data: { status, graceEndsAt, suspendedAt: status === 'suspended' ? now : undefined } })
  }
  return organization
}

import { db } from '@/lib/db'
import { unauthorizedResponse, forbiddenResponse, type JWTPayload } from '@/lib/auth'
import { NextResponse } from 'next/server'

export type TenantContext = JWTPayload & {
  organizationId: string
  organizationRole: string
}

export async function getTenantContext(payload: JWTPayload | null): Promise<TenantContext | null> {
  if (!payload) return null
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, role: true, status: true, memberships: { where: { status: 'active' }, select: { id: true, organizationId: true, role: true, organization: { select: { status: true, organizationType: true } } } } },
  })
  if (!user || user.status !== 'active') return null
  const membership = payload.organizationId
    ? user.memberships.find((item) => item.organizationId === payload.organizationId)
    : user.memberships.length === 1 ? user.memberships[0] : undefined
  if (!membership) return null
  if (membership.organization.status === 'suspended' || membership.organization.status === 'archived') return null
  return { ...payload, organizationId: membership.organizationId, membershipId: membership.id, organizationRole: membership.role }
}

export async function requireTenant(payload: JWTPayload | null) {
  const context = await getTenantContext(payload)
  if (!context) return { context: null, response: unauthorizedResponse('Active organization membership required') }
  return { context, response: null }
}

export async function requireOrganizationAdmin(payload: JWTPayload | null) {
  const result = await requireTenant(payload)
  if (!result.context) return result
  if (!['owner', 'admin'].includes(result.context.organizationRole) && result.context.role !== 'admin') {
    return { context: null, response: forbiddenResponse('Organization administrator access required') }
  }
  return result
}

export function tenantResponse(message: string, status = 403) {
  return NextResponse.json({ error: message }, { status })
}

export async function recordAuditEvent(input: { organizationId: string; actorUserId?: string; action: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> }) {
  return db.auditEvent.create({ data: { ...input, metadata: input.metadata ? JSON.stringify(input.metadata) : undefined } })
}

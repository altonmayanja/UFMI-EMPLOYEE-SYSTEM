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
    select: { id: true, username: true, role: true, status: true, organizationId: true, memberships: { where: { status: 'active' }, select: { organizationId: true, role: true }, take: 1 } },
  })
  const membership = user?.memberships[0]
  if (!user || user.status !== 'active' || !membership) return null
  return { ...payload, organizationId: membership.organizationId, organizationRole: membership.role }
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

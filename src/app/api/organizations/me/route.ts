import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrganizationEntitlements, canAddEmployee } from '@/lib/entitlements'
import { requireTenant } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  const { context, response } = await requireTenant(auth)
  if (!context) return response

  const access = await getOrganizationEntitlements(context.organizationId)
  const [employeeCount, reportCount] = await Promise.all([
    db.user.count({ where: { organizationId: context.organizationId, role: 'employee', status: { not: 'archived' } } }),
    db.dailyReport.count({ where: { user: { organizationId: context.organizationId } } }),
  ])
  return NextResponse.json({
    organization: access.organization,
    plan: access.plan,
    subscription: access.subscription,
    entitlements: access.entitlements,
    usage: { employeeCount, reportCount, canAddEmployee: await canAddEmployee(context.organizationId) },
  })
}

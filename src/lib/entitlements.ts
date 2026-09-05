import { db } from '@/lib/db'

export const DEFAULT_PLANS = [
  { key: 'starter', name: 'Starter', monthlyPrice: 0, maxEmployees: 10, entitlements: ['reports', 'basic_exports'] },
  { key: 'business', name: 'Business', monthlyPrice: 4900, maxEmployees: 50, entitlements: ['reports', 'basic_exports', 'monthly_reports', 'reminders'] },
  { key: 'professional', name: 'Professional', monthlyPrice: 12900, maxEmployees: 250, entitlements: ['reports', 'basic_exports', 'monthly_reports', 'reminders', 'advanced_exports', 'audit_log'] },
  { key: 'enterprise', name: 'Enterprise', monthlyPrice: 0, maxEmployees: null, entitlements: ['reports', 'basic_exports', 'monthly_reports', 'reminders', 'advanced_exports', 'audit_log', 'priority_support'] },
] as const

export async function ensureDefaultPlans() {
  await Promise.all(DEFAULT_PLANS.map((plan) => db.plan.upsert({ where: { key: plan.key }, update: plan, create: plan })))
}

export async function getOrganizationEntitlements(organizationId: string) {
  const subscription = await db.subscription.findUnique({ where: { organizationId }, include: { plan: true, organization: true } })
  const plan = subscription?.plan
  const entitlements = plan ? JSON.parse(plan.entitlements) as string[] : []
  return { plan, subscription, entitlements, status: subscription?.status ?? 'trialing', organization: subscription?.organization }
}

export async function hasFeature(organizationId: string, feature: string) {
  const access = await getOrganizationEntitlements(organizationId)
  return access.status !== 'suspended' && access.status !== 'archived' && access.entitlements.includes(feature)
}

export async function canAddEmployee(organizationId: string) {
  const access = await getOrganizationEntitlements(organizationId)
  if (!access.plan?.maxEmployees) return true
  const count = await db.user.count({ where: { organizationId, role: 'employee', status: { not: 'archived' } } })
  return count < access.plan.maxEmployees
}

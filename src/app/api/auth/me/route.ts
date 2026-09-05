import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { getTenantContext } from '@/lib/tenant'

// GET /api/auth/me
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const context = await getTenantContext(payload)
    if (!context) {
      return NextResponse.json({ error: 'Active organization membership required' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: context.userId },
      include: { profile: true },
    })

    if (!user || user.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      organizationId: context.organizationId,
      membershipId: context.membershipId,
      organizationRole: context.organizationRole,
      createdAt: user.createdAt,
      profile: user.profile ? {
        employeeId: user.profile.employeeId,
        position: user.profile.position,
      } : null,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { signToken } from '@/lib/auth'

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, organizationId: requestedOrganizationId } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { username },
      include: { profile: true, memberships: { where: { status: 'active' }, include: { organization: true } } },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is suspended or archived. Contact admin.' },
        { status: 403 }
      )
    }

    const membership = requestedOrganizationId
      ? user.memberships.find((item) => item.organizationId === requestedOrganizationId)
      : user.memberships.length === 1 ? user.memberships[0] : undefined
    if (user.memberships.length > 1 && !membership) {
      return NextResponse.json({ error: 'Organization selection is required', organizations: user.memberships.map((item) => ({ id: item.organizationId, name: item.organization.name, slug: item.organization.slug })) }, { status: 409 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'employee' | 'super_admin',
      organizationId: membership?.organizationId ?? user.organizationId ?? undefined,
      membershipId: membership?.id,
      organizationRole: membership?.role,
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        details: JSON.stringify({ username: user.username }),
      },
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.profile ? {
          employeeId: user.profile.employeeId,
          position: user.profile.position,
        } : null,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

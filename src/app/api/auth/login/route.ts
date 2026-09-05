import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { signToken } from '@/lib/auth'

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const organizationInput = typeof body.organization === 'string' ? body.organization.trim() : ''
    const requestedOrganizationId = typeof body.organizationId === 'string' ? body.organizationId : undefined

    if (!username || !password || (!organizationInput && !requestedOrganizationId)) {
      return NextResponse.json(
        { error: 'Organization, username, and password are required' },
        { status: 400 }
      )
    }

    const organization = requestedOrganizationId
      ? await db.organization.findUnique({ where: { id: requestedOrganizationId } })
      : await db.organization.findFirst({
          where: {
            OR: [
              { slug: organizationInput.toLowerCase() },
              { name: { equals: organizationInput, mode: 'insensitive' } },
            ],
          },
        })

    if (!organization || organization.status === 'suspended' || organization.status === 'archived') {
      return NextResponse.json({ error: 'Organization not found or unavailable.' }, { status: 403 })
    }

    const user = await db.user.findFirst({
      where: {
        username,
        OR: [
          { organizationId: organization.id },
          { memberships: { some: { organizationId: organization.id, status: 'active' } } },
        ],
      },
      include: { profile: true, memberships: { where: { status: 'active' }, include: { organization: true } } },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const membership = user.memberships.find((item) => item.organizationId === organization.id)
    if (membership && membership.organization.status !== 'active' && membership.organization.status !== 'trial' && membership.organization.status !== 'grace') {
      return NextResponse.json({ error: 'Organization access is unavailable.' }, { status: 403 })
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
        organizationId: membership?.organizationId ?? organization.id,
        membershipId: membership?.id,
        organizationRole: membership?.role,
        organization: { id: organization.id, name: organization.name, slug: organization.slug },
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

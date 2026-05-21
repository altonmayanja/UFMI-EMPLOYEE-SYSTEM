import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

// Helper: authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

// PATCH /api/admin/employees/[id] - Update employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, position, department, password } = body

    const user = await db.user.findUnique({
      where: { id },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow modifying the main admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin users through this endpoint' },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}
    const profileUpdates: Record<string, unknown> = {}

    if (status && ['active', 'suspended', 'archived'].includes(status)) {
      updates.status = status
    }

    if (position) {
      profileUpdates.position = position
    }

    if (department) {
      profileUpdates.department = department
    }

    if (password) {
      updates.passwordHash = await hashPassword(password)
    }

    // Update user
    if (Object.keys(updates).length > 0) {
      await db.user.update({
        where: { id },
        data: updates,
      })
    }

    // Update profile
    if (Object.keys(profileUpdates).length > 0 && user.profile) {
      await db.employeeProfile.update({
        where: { userId: id },
        data: profileUpdates,
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'employee_updated',
        details: JSON.stringify({ targetUserId: id, updates, profileUpdates }),
      },
    })

    const updatedUser = await db.user.findUnique({
      where: { id },
      include: { profile: true },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/employees/[id] - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    await db.user.delete({ where: { id } })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'employee_deleted',
        details: JSON.stringify({ targetUserId: id, username: user.username }),
      },
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

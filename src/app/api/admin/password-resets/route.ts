import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// GET /api/admin/password-resets — list all reset requests
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const requests = await db.passwordResetRequest.findMany({
      where: status !== 'all' ? { status } : undefined,
      include: {
        user: {
          select: {
            profile: { select: { employeeId: true, position: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Count pending
    const pendingCount = await db.passwordResetRequest.count({
      where: { status: 'pending' },
    })

    return NextResponse.json({ requests, pendingCount })
  } catch (error) {
    console.error('Get password resets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

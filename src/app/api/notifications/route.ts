import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET /api/notifications - List notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))

    const where: Prisma.NotificationWhereInput = {
      OR: [
        { userId: payload.userId },
        { userId: null }, // broadcast notifications
      ],
    }

    if (unreadOnly) {
      where.read = false
      where.userId = payload.userId // unread only makes sense for personal notifications
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Count unread
    const unreadCount = await db.notification.count({
      where: {
        userId: payload.userId,
        read: false,
      },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('List notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Mark all as read (for current user)
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) return unauthorizedResponse()

    const body = await request.json()
    const { action } = body

    if (action === 'mark-all-read') {
      await db.notification.updateMany({
        where: {
          userId: payload.userId,
          read: false,
        },
        data: { read: true },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAdmin, forbiddenResponse } from '@/lib/auth'

// POST /api/admin/notifications - Send a notification (to specific user(s) or broadcast)
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const body = await request.json()
    const { title, message, type, userIds, broadcast } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const validTypes = ['info', 'reminder', 'warning', 'success', 'announcement']
    const notifType = validTypes.includes(type) ? type : 'info'

    // Broadcast to all employees
    if (broadcast === true) {
      const notification = await db.notification.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          type: notifType,
          userId: null, // null = broadcast
        },
      })

      // Audit log
      await db.auditLog.create({
        data: {
          userId: payload.userId,
          action: 'notification_broadcast',
          details: JSON.stringify({ notificationId: notification.id, title: title.trim(), type: notifType }),
        },
      })

      return NextResponse.json({
        success: true,
        notification,
        sentTo: 'all_employees',
      }, { status: 201 })
    }

    // Send to specific users
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Validate users exist
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      })

      if (users.length === 0) {
        return NextResponse.json({ error: 'No valid users found' }, { status: 400 })
      }

      const notifications = await db.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: title.trim(),
          message: message.trim(),
          type: notifType,
        })),
      })

      // Audit log
      await db.auditLog.create({
        data: {
          userId: payload.userId,
          action: 'notification_sent',
          details: JSON.stringify({
            title: title.trim(),
            type: notifType,
            recipientCount: users.length,
            recipientIds: users.map((u) => u.id),
          }),
        },
      })

      return NextResponse.json({
        success: true,
        sentCount: notifications.count,
        recipients: users.map((u) => u.username),
      }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Provide either userIds array or broadcast: true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin send notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/notifications - List all notifications (admin view)
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { username: true, profile: { select: { employeeId: true, position: true } } },
        },
      },
    })

    const total = await db.notification.count()

    return NextResponse.json({ notifications, total })
  } catch (error) {
    console.error('Admin list notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

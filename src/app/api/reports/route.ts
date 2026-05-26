import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

// Helper: authenticate request and return user payload
export async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return payload
}

// GET /api/reports - Get reports (own for employee, all for admin)
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM format

    if (payload.role === 'employee') {
      // Employee sees only their own reports
      const where: Record<string, unknown> = { userId: payload.userId }
      if (month) {
        where.date = { startsWith: month }
      }

      const reports = await db.dailyReport.findMany({
        where,
        orderBy: { date: 'desc' },
      })

      return NextResponse.json(reports)
    }

    // Admin sees all reports
    return NextResponse.json({ error: 'Use /api/admin/reports for admin access' }, { status: 400 })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reports - Create daily report
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, activityText, location, timeIn, timeOut, comments } = body

    if (!date || !activityText) {
      return NextResponse.json(
        { error: 'Date and activity text are required' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM) if provided
    const timeRegex = /^\d{2}:\d{2}$/
    if (timeIn && !timeRegex.test(timeIn)) {
      return NextResponse.json(
        { error: 'Invalid time-in format. Use HH:MM (e.g. 08:00)' },
        { status: 400 }
      )
    }
    if (timeOut && !timeRegex.test(timeOut)) {
      return NextResponse.json(
        { error: 'Invalid time-out format. Use HH:MM (e.g. 17:00)' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Check if report already exists for this user and date
    const existing = await db.dailyReport.findUnique({
      where: {
        userId_date: {
          userId: payload.userId,
          date,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a report for this date' },
        { status: 409 }
      )
    }

    const report = await db.dailyReport.create({
      data: {
        userId: payload.userId,
        date,
        activityText: activityText.trim(),
        location: location?.trim() || null,
        timeIn: timeIn?.trim() || null,
        timeOut: timeOut?.trim() || null,
        comments: comments?.trim() || null,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'report_created',
        details: JSON.stringify({ reportId: report.id, date }),
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

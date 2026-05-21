import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

// Helper: authenticate request
async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

// PUT /api/reports/[id] - Update a report (employee can update their own)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { activityText } = body

    if (!activityText) {
      return NextResponse.json(
        { error: 'Activity text is required' },
        { status: 400 }
      )
    }

    const report = await db.dailyReport.findUnique({ where: { id } })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Employee can only update their own reports
    if (payload.role === 'employee' && report.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await db.dailyReport.update({
      where: { id },
      data: { activityText: activityText.trim() },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const report = await db.dailyReport.findUnique({ where: { id } })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (payload.role === 'employee' && report.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.dailyReport.delete({ where: { id } })

    return NextResponse.json({ message: 'Report deleted' })
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

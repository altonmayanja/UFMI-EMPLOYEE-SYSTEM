import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth'

// GET /api/reports/monthly/[id] - Get a specific monthly report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload) return unauthorizedResponse()

    const { id } = await params

    const report = await db.monthlyReport.findUnique({
      where: { id },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Privacy: employee can only see their own reports
    if (payload.role === 'employee' && report.userId !== payload.userId) {
      return forbiddenResponse('You can only view your own reports')
    }

    const reportData = JSON.parse(report.reportData)

    return NextResponse.json({
      id: report.id,
      ...reportData,
      status: report.status,
      generatedBy: report.generatedBy,
      createdAt: report.createdAt,
      approvedAt: report.approvedAt,
    })
  } catch (error) {
    console.error('Get monthly report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAdmin, forbiddenResponse } from '@/lib/auth'

// GET /api/admin/reports/monthly/[id] - Admin gets any monthly report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const { id } = await params

    const report = await db.monthlyReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            profile: { select: { employeeId: true, position: true } },
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const reportData = JSON.parse(report.reportData)

    return NextResponse.json({
      id: report.id,
      ...reportData,
      user: report.user,
      status: report.status,
      generatedBy: report.generatedBy,
      createdAt: report.createdAt,
      approvedAt: report.approvedAt,
    })
  } catch (error) {
    console.error('Admin get monthly report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reports/monthly/[id] - Admin deletes a report with audit log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const { id } = await params

    const report = await db.monthlyReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    await db.monthlyReport.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'monthly_report_deleted',
        details: JSON.stringify({ reportId: id, month: report.month, userId: report.userId }),
      },
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Admin delete monthly report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

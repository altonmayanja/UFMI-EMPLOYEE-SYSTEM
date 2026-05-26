import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAdmin, forbiddenResponse } from '@/lib/auth'
import { generateBulkReports } from '@/lib/report-service'
import { checkRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limiter'
import { Prisma } from '@prisma/client'

// POST /api/admin/reports/monthly/bulk - Bulk generate monthly reports
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const body = await request.json()
    const { month, employeeStatus, onlyMissing } = body

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Month parameter is required (YYYY-MM format)' }, { status: 400 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(payload.userId, 'admin_bulk')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: getRateLimitErrorMessage('admin_bulk') },
        { status: 429 }
      )
    }

    // Build employee filter
    const where: Prisma.UserWhereInput = {
      role: 'employee',
    }

    // Filter by employee status
    if (employeeStatus) {
      where.status = employeeStatus
    }

    let employees = await db.user.findMany({
      where,
      select: { id: true },
    })

    if (employees.length === 0) {
      return NextResponse.json({
        results: [],
        summary: { total: 0, success: 0, failed: 0 },
      })
    }

    // If onlyMissing, exclude employees who already have a report for this month
    if (onlyMissing) {
      const existingReports = await db.monthlyReport.findMany({
        where: {
          month,
          userId: { in: employees.map((e) => e.id) },
        },
        select: { userId: true },
      })
      const existingUserIds = new Set(existingReports.map((r) => r.userId))
      employees = employees.filter((e) => !existingUserIds.has(e.id))
    }

    if (employees.length === 0) {
      return NextResponse.json({
        results: [],
        summary: { total: 0, success: 0, failed: 0 },
        message: onlyMissing ? 'All employees already have reports for this month' : 'No employees found matching filters',
      })
    }

    const userIds = employees.map((e) => e.id)

    const results = await generateBulkReports({
      month,
      userIds,
      generatedBy: payload.userId,
    })

    const successCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('Admin bulk generate monthly reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

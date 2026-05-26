import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAdmin, forbiddenResponse } from '@/lib/auth'
import { generateReport } from '@/lib/report-service'
import { checkRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limiter'
import { Prisma } from '@prisma/client'

// GET /api/admin/reports/monthly - List ALL monthly reports with pagination, sorting, and search
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

    // Sorting
    const sort = searchParams.get('sort') || 'month'
    const order = searchParams.get('order') || 'desc'

    // Filters
    const search = searchParams.get('search') || ''
    const month = searchParams.get('month')
    const userId = searchParams.get('userId')

    // Build where clause
    const where: Prisma.MonthlyReportWhereInput = {}

    if (month) where.month = month
    if (userId) where.userId = userId

    // Search by employee username (case-insensitive)
    if (search) {
      const matchingUsers = await db.user.findMany({
        where: {
          username: { contains: search, mode: 'insensitive' },
        },
        select: { id: true },
      })
      const searchUserIds = matchingUsers.map((u) => u.id)
      if (searchUserIds.length === 0) {
        return NextResponse.json({ reports: [], total: 0, page, pageSize, totalPages: 0 })
      }
      // Combine with existing userId filter if present
      if (where.userId && 'in' in (where.userId as object)) {
        const existingIds = (where.userId as { in: string[] }).in
        where.userId = { in: existingIds.filter((id) => searchUserIds.includes(id)) }
      } else {
        where.userId = { in: searchUserIds }
      }
    }

    // Validate sort field
    const validSortFields = ['month', 'createdAt', 'submissionRate', 'totalActivities'] as const
    const sortField = validSortFields.includes(sort as typeof validSortFields[number])
      ? (sort as typeof validSortFields[number])
      : 'month'
    const sortOrder: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc'

    const total = await db.monthlyReport.count({ where })

    const totalPages = Math.ceil(total / pageSize)

    const reports = await db.monthlyReport.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            profile: { select: { employeeId: true, position: true } },
          },
        },
      },
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const parsed = reports.map((r) => ({
      id: r.id,
      month: r.month,
      userId: r.userId,
      user: r.user,
      totalReports: r.totalReports,
      totalActivities: r.totalActivities,
      submissionRate: r.submissionRate,
      status: r.status,
      summary: r.summary,
      achievements: JSON.parse(r.achievements || '[]'),
      categoryBreakdown: JSON.parse(r.categoryBreakdown || '[]'),
      generatedBy: r.generatedBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      approvedAt: r.approvedAt,
    }))

    return NextResponse.json({ reports: parsed, total, page, pageSize, totalPages })
  } catch (error) {
    console.error('Admin list monthly reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/reports/monthly - Generate/regenerate a report for a specific employee
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) return forbiddenResponse()

    const body = await request.json()
    const { month, userId, force } = body

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Month parameter is required (YYYY-MM format)' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Rate limiting (per admin)
    const rateLimit = checkRateLimit(payload.userId, 'admin_generate')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: getRateLimitErrorMessage('admin_generate') },
        { status: 429 }
      )
    }

    try {
      const result = await generateReport({
        userId,
        month,
        generatedBy: payload.userId,
        force: force === true,
      })

      // Get user info for response
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { username: true, profile: { select: { employeeId: true, position: true } } },
      })

      return NextResponse.json(
        {
          id: result.dbRecord.id,
          ...result.report,
          user,
          status: result.dbRecord.status,
          generatedBy: result.dbRecord.generatedBy,
          createdAt: result.dbRecord.createdAt,
          updatedAt: result.dbRecord.updatedAt,
        },
        { status: result.isRegeneration ? 200 : 201 }
      )
    } catch (error) {
      // Check if it's a "report already exists" error
      if (error instanceof Error && 'existingReportId' in error) {
        return NextResponse.json(
          {
            error: error.message,
            existingReportId: (error as unknown as Record<string, string>).existingReportId,
          },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Admin generate monthly report error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

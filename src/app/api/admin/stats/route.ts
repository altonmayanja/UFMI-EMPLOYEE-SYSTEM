import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

// Helper: authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]
    const currentMonth = today.substring(0, 7)

    const [
      totalEmployees,
      activeEmployees,
      suspendedEmployees,
      totalReports,
      todayReports,
      monthReports,
      missingTodayReports,
    ] = await Promise.all([
      db.user.count({ where: { role: 'employee' } }),
      db.user.count({ where: { role: 'employee', status: 'active' } }),
      db.user.count({ where: { role: 'employee', status: 'suspended' } }),
      db.dailyReport.count(),
      db.dailyReport.count({ where: { date: today } }),
      db.dailyReport.count({ where: { date: { startsWith: currentMonth } } }),
      // Employees missing today's report
      db.user.findMany({
        where: {
          role: 'employee',
          status: 'active',
          NOT: {
            reports: { some: { date: today } },
          },
        },
        select: {
          id: true,
          username: true,
          profile: { select: { employeeId: true, position: true } },
        },
      }),
    ])

    // Get recent reports (last 10)
    const recentReports = await db.dailyReport.findMany({
      take: 10,
      include: {
        user: {
          select: {
            username: true,
            profile: { select: { employeeId: true, position: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      suspendedEmployees,
      totalReports,
      todayReports,
      monthReports,
      currentMonth,
      today,
      missingTodayReports,
      recentReports,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

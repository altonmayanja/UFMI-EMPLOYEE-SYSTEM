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

// GET /api/admin/reports - Get all reports with filters
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const month = searchParams.get('month') // YYYY-MM format
    const userId = searchParams.get('userId')
    const department = searchParams.get('department')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (date) {
      where.date = date
    } else if (month) {
      where.date = { startsWith: month }
    }

    if (userId) {
      where.userId = userId
    }

    if (department) {
      where.user = {
        profile: { department },
      }
    }

    const [reports, total] = await Promise.all([
      db.dailyReport.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              status: true,
              profile: {
                select: {
                  employeeId: true,
                  position: true,
                  department: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.dailyReport.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get admin reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

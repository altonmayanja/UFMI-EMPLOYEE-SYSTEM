import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

// Helper: authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

// Predefined positions and departments
const POSITIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Junior Developer',
  'QA Engineer',
  'DevOps Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Project Manager',
  'Data Analyst',
  'Team Lead',
  'HR Manager',
  'Finance Officer',
  'Administrator',
]

const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Quality Assurance',
  'IT Support',
]

// GET /api/admin/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (department) {
      where.profile = { department }
    }
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { profile: { employeeId: { contains: search } } },
        { profile: { position: { contains: search } } },
      ]
    }

    const employees = await db.user.findMany({
      where,
      include: { profile: true, _count: { select: { reports: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ employees, positions: POSITIONS, departments: DEPARTMENTS })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, employeeId, position, department } = body

    // Validate required fields
    if (!username || !password || !employeeId || !position || !department) {
      return NextResponse.json(
        { error: 'All fields are required: username, password, employeeId, position, department' },
        { status: 400 }
      )
    }

    // Validate position and department
    if (!POSITIONS.includes(position)) {
      return NextResponse.json(
        { error: `Invalid position. Must be one of: ${POSITIONS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!DEPARTMENTS.includes(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}` },
        { status: 400 }
      )
    }

    // Check username uniqueness
    const existingUser = await db.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Check employeeId uniqueness
    const existingProfile = await db.employeeProfile.findUnique({ where: { employeeId } })
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user with profile
    const user = await db.user.create({
      data: {
        username,
        passwordHash,
        role: 'employee',
        status: 'active',
        profile: {
          create: {
            employeeId,
            position,
            department,
          },
        },
      },
      include: { profile: true },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'employee_created',
        details: JSON.stringify({
          targetUserId: user.id,
          username: user.username,
          employeeId,
          position,
          department,
        }),
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

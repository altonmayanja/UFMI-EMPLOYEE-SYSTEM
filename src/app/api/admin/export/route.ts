import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import ExcelJS from 'exceljs'

// Helper: authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

// GET /api/admin/export - Export monthly reports to Excel
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateAdmin(request)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM format

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (YYYY-MM format)' },
        { status: 400 }
      )
    }

    // Fetch all reports for the month with user data
    const reports = await db.dailyReport.findMany({
      where: { date: { startsWith: month } },
      include: {
        user: {
          select: {
            username: true,
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
      orderBy: [
        { user: { username: 'asc' } },
        { date: 'asc' },
      ],
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'export',
        details: JSON.stringify({ month, reportCount: reports.length }),
      },
    })

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Daily Report System'
    workbook.created = new Date()

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    summarySheet.columns = [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Total Reports', key: 'totalReports', width: 15 },
      { header: 'First Report', key: 'firstReport', width: 15 },
      { header: 'Last Report', key: 'lastReport', width: 15 },
    ]

    // Group reports by user
    const userReports: Record<string, typeof reports> = {}
    for (const report of reports) {
      if (!userReports[report.userId]) {
        userReports[report.userId] = []
      }
      userReports[report.userId].push(report)
    }

    // Fill summary
    for (const [userId, userReportList] of Object.entries(userReports)) {
      const firstReport = userReportList[0]
      const lastReport = userReportList[userReportList.length - 1]

      summarySheet.addRow({
        employee: firstReport.user.username,
        employeeId: firstReport.user.profile?.employeeId || 'N/A',
        department: firstReport.user.profile?.department || 'N/A',
        position: firstReport.user.profile?.position || 'N/A',
        totalReports: userReportList.length,
        firstReport: firstReport.date,
        lastReport: lastReport.date,
      })
    }

    // Style summary header
    const summaryHeaderRow = summarySheet.getRow(1)
    summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    }

    // Detail sheet
    const detailSheet = workbook.addWorksheet('Daily Reports')
    detailSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Activity', key: 'activity', width: 60 },
    ]

    for (const report of reports) {
      detailSheet.addRow({
        date: report.date,
        employee: report.user.username,
        employeeId: report.user.profile?.employeeId || 'N/A',
        department: report.user.profile?.department || 'N/A',
        position: report.user.profile?.position || 'N/A',
        activity: report.activityText,
      })
    }

    // Style detail header
    const detailHeaderRow = detailSheet.getRow(1)
    detailHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    detailHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    return new NextResponse(buffer as Buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="daily-reports-${month}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

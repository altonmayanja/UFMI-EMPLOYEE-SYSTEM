/**
 * Shared Report Generation Service
 *
 * Centralizes the report generation logic used by both
 * employee and admin API routes. Eliminates code duplication.
 */

import { db } from '@/lib/db'
import { DEFAULT_CATEGORIES, processMonthlyActivities, generateMonthlyReport, type MonthlyReportOutput } from '@/lib/report-engine'

export interface GenerateReportParams {
  userId: string
  month: string
  force?: boolean
  generatedBy?: string // 'self' for employee, or admin userId
}

export interface GenerateReportResult {
  report: MonthlyReportOutput
  dbRecord: {
    id: string
    status: string
    generatedBy: string | null
    createdAt: Date
    updatedAt: Date
    originalCreatedAt: Date | null
    lastRegeneratedAt: Date | null
    regeneratedBy: string | null
    regenerationCount: number
  }
  isRegeneration: boolean
}

/**
 * Generate or regenerate a monthly report for a user.
 *
 * - If no report exists: creates new
 * - If report exists and force=true: regenerates with audit tracking
 * - If report exists and force=false: throws error with report ID
 */
export async function generateReport(params: GenerateReportParams): Promise<GenerateReportResult> {
  const { userId, month, force = false, generatedBy = 'self' } = params

  // Validate month format
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month parameter is required (YYYY-MM format)')
  }

  // Check if report already exists
  const existing = await db.monthlyReport.findUnique({
    where: { userId_month: { userId, month } },
  })

  if (existing && !force) {
    const err = new Error('Monthly report already exists for this period. Use force=true to regenerate.')
    ;(err as unknown as Record<string, string>).existingReportId = existing.id
    throw err
  }

  // Get user info
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get all daily reports for the month
  const dailyReports = await db.dailyReport.findMany({
    where: { userId, date: { startsWith: month } },
    orderBy: { date: 'asc' },
  })

  if (dailyReports.length === 0) {
    throw new Error('No daily reports found for this month')
  }

  // Run the report intelligence engine
  const dailyActivities = dailyReports.map((r) => ({
    date: r.date,
    activityText: r.activityText,
    createdAt: r.createdAt.toISOString(),
    location: r.location,
    timeIn: r.timeIn,
    timeOut: r.timeOut,
    comments: r.comments,
  }))

  const processedData = processMonthlyActivities(dailyActivities, month, DEFAULT_CATEGORIES)

  const report = generateMonthlyReport({
    employeeName: user.username,
    employeeId: user.profile?.employeeId || 'N/A',
    position: user.profile?.position || 'N/A',
    month,
    processedData,
  })

  const isRegeneration = !!existing

  // Upsert: create or update
  const saved = existing
    ? await db.monthlyReport.update({
        where: { id: existing.id },
        data: {
          reportData: JSON.stringify(report),
          totalReports: processedData.statistics.totalReportsSubmitted,
          totalActivities: processedData.statistics.totalActivitiesRecorded,
          submissionRate: processedData.statistics.submissionRate,
          categoryBreakdown: JSON.stringify(processedData.categoryBreakdown),
          summary: report.summary,
          achievements: JSON.stringify(report.achievements),
          status: 'generated',
          generatedBy,
          lastRegeneratedAt: new Date(),
          regeneratedBy: generatedBy,
          regenerationCount: { increment: 1 },
        },
      })
    : await db.monthlyReport.create({
        data: {
          userId,
          month,
          reportData: JSON.stringify(report),
          totalReports: processedData.statistics.totalReportsSubmitted,
          totalActivities: processedData.statistics.totalActivitiesRecorded,
          submissionRate: processedData.statistics.submissionRate,
          categoryBreakdown: JSON.stringify(processedData.categoryBreakdown),
          summary: report.summary,
          achievements: JSON.stringify(report.achievements),
          status: 'generated',
          generatedBy,
          originalCreatedAt: new Date(),
        },
      })

  // Audit log
  await db.auditLog.create({
    data: {
      userId: generatedBy === 'self' ? userId : generatedBy,
      action: isRegeneration ? 'monthly_report_regenerated' : 'monthly_report_generated',
      details: JSON.stringify({
        reportId: saved.id,
        month,
        type: generatedBy === 'self' ? 'self' : 'admin',
        isRegeneration,
        regeneratedBy: isRegeneration ? generatedBy : undefined,
      }),
    },
  })

  return {
    report,
    dbRecord: {
      id: saved.id,
      status: saved.status,
      generatedBy: saved.generatedBy,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      originalCreatedAt: saved.originalCreatedAt,
      lastRegeneratedAt: saved.lastRegeneratedAt,
      regeneratedBy: saved.regeneratedBy,
      regenerationCount: saved.regenerationCount,
    },
    isRegeneration,
  }
}

/**
 * Generate reports in bulk for multiple employees.
 * Returns results for each employee (success or error).
 */
export async function generateBulkReports(params: {
  month: string
  userIds: string[]
  generatedBy: string
}): Promise<{ userId: string; username: string; success: boolean; reportId?: string; error?: string }[]> {
  const results: { userId: string; username: string; success: boolean; reportId?: string; error?: string }[] = []

  for (const userId of params.userIds) {
    try {
      // Get user for result
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })

      const result = await generateReport({
        userId,
        month: params.month,
        force: true,
        generatedBy: params.generatedBy,
      })

      results.push({
        userId,
        username: user?.username || 'Unknown',
        success: true,
        reportId: result.dbRecord.id,
      })
    } catch (error) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })
      results.push({
        userId,
        username: user?.username || 'Unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

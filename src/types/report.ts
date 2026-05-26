/**
 * Frontend TypeScript interfaces for the Report Intelligence Engine.
 * Replaces all `any` types used in report-related components.
 */

export interface MonthlyReportListItem {
  id: string
  month: string
  userId?: string
  user?: {
    username: string
    profile?: {
      employeeId?: string
      position?: string
    } | null
  }
  totalReports: number
  totalActivities: number
  submissionRate: number
  status: string
  summary: string
  achievements: string[]
  categoryBreakdown: CategoryBreakdownItem[]
  generatedBy: string | null
  createdAt: string
  updatedAt: string
  approvedAt: string | null
}

export interface CategoryBreakdownItem {
  category: string
  description: string
  count: number
  percentage: number
}

export interface MonthlyReportDetail extends MonthlyReportListItem {
  employeeInfo: {
    name: string
    employeeId: string
    position: string
    reportingMonth: string
    reportingMonthLabel: string
  }
  summary: string
  dominantFocus: string | null
  statistics: {
    totalReportsSubmitted: number
    expectedReports: number
    submissionRate: number
    missedSubmissions: number
    longestStreak: number
    currentStreak: number
    totalActivities: number
    avgActivitiesPerDay: number
    avgWordsPerReport: number
    totalWords: number
    mostActiveDay: string | null
    mostActiveDayCount: number
    mostActiveWeek: string | null
    mostActiveWeekCount: number
    categoriesWorked: number
    topCategory: string
    mostFrequentCategory: string
    top3Categories: { name: string; count: number; percentage: number }[]
  }
  keyWorkAreas: string[]
  focusAreas: string[]
  achievements: string[]
  activityTimeline: {
    date: string
    dateLabel: string
    activities: string[]
    primaryCategory: string
  }[]
  managerNotes: string
  managerRating: string
  approvedBy: string | null
  approvedAt: string | null
  engineVersion: string
}

export interface RegenerationInfo {
  originalCreatedAt: string | null
  lastRegeneratedAt: string | null
  regeneratedBy: string | null
  regenerationCount: number
}

export interface BulkGenerateRequest {
  month: string
  employeeStatus?: string
  onlyMissing?: boolean
}

export interface BulkGenerateResult {
  userId: string
  username: string
  success: boolean
  reportId?: string
  error?: string
}

export interface PaginatedReports {
  reports: MonthlyReportListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

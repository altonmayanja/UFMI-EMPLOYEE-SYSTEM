'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday, parseISO } from 'date-fns'
import {
  ClipboardList, FileText, Send, Users, BarChart3, Download,
  ChevronLeft, ChevronRight, LogOut, Menu, Plus, Pencil,
  Trash2, Loader2, CalendarDays, UserCheck, AlertCircle,
  Calendar, Search, Filter, X, CheckCircle2, Clock,
  Building2, Briefcase, UserCircle, Eye, ChevronDown,
} from 'lucide-react'

import { useAuthStore, type User } from '@/store/auth-store'
import { apiPost, apiGet, apiPut, apiDelete, apiPatch, ApiError } from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

// =====================================================================
// TYPES
// =====================================================================

interface DailyReport {
  id: string
  userId: string
  date: string
  activityText: string
  createdAt: string
  user?: {
    id: string
    username: string
    role: string
    status: string
    profile?: { employeeId?: string; position?: string; department?: string }
  }
}

interface Employee {
  id: string
  username: string
  role: string
  status: string
  createdAt: string
  profile?: { employeeId?: string; position?: string; department?: string }
  _count?: { reports: number }
}

interface AdminStats {
  totalEmployees: number
  activeEmployees: number
  suspendedEmployees: number
  totalReports: number
  todayReports: number
  monthReports: number
  currentMonth: string
  today: string
  departmentStats: { department: string; count: number }[]
  missingTodayReports: { id: string; username: string; profile?: { employeeId?: string; department?: string } }[]
  recentReports: DailyReport[]
}

interface PaginatedReports {
  reports: DailyReport[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface EmployeesData {
  employees: Employee[]
  positions: string[]
  departments: string[]
}

type EmployeeView = 'submit' | 'my-reports'
type AdminView = 'overview' | 'employees' | 'reports' | 'export'

// =====================================================================
// QUERY CLIENT
// =====================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// =====================================================================
// CUSTOM SCROLLBAR HELPER
// =====================================================================

function ScrollableContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-y-auto custom-scrollbar ${className || ''}`} style={{ maxHeight: 'calc(100vh - 5rem)' }}>
      {children}
    </div>
  )
}

// =====================================================================
// LOGIN PAGE
// =====================================================================

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiPost<{ token: string; user: User }>('/api/auth/login', { username, password })
      login(data.token, data.user)
      toast.success('Welcome back!')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-emerald-100 shadow-lg">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Daily Report System</CardTitle>
              <CardDescription className="mt-1 text-gray-500">Sign in to continue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// =====================================================================
// SIDEBAR NAVIGATION (shared)
// =====================================================================

const employeeNavItems: { key: EmployeeView; label: string; icon: React.ReactNode }[] = [
  { key: 'submit', label: 'Submit Report', icon: <Send className="h-4 w-4" /> },
  { key: 'my-reports', label: 'My Reports', icon: <FileText className="h-4 w-4" /> },
]

const adminNavItems: { key: AdminView; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'employees', label: 'Employees', icon: <Users className="h-4 w-4" /> },
  { key: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
  { key: 'export', label: 'Export', icon: <Download className="h-4 w-4" /> },
]

function SidebarNavContent({
  isAdmin,
  currentView,
  onNavigate,
  onLogout,
  onClose,
}: {
  isAdmin: boolean
  currentView: string
  onNavigate: (view: string) => void
  onLogout: () => void
  onClose?: () => void
}) {
  const items = isAdmin ? adminNavItems : employeeNavItems
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm text-gray-900 truncate">Daily Report</h2>
          <p className="text-xs text-gray-500 truncate">{user?.username}</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.key)
                onClose?.()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                currentView === item.key
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

// =====================================================================
// EMPLOYEE: SUBMIT REPORT
// =====================================================================

function EmployeeSubmitReport() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [activityText, setActivityText] = useState('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const monthStr = format(selectedDate, 'yyyy-MM')

  const { data: reports = [], isLoading } = useQuery<DailyReport[]>({
    queryKey: ['my-reports', monthStr],
    queryFn: () => apiGet<DailyReport[]>(`/api/reports?month=${monthStr}`),
  })

  const existingReport = reports.find((r) => r.date === format(selectedDate, 'yyyy-MM-dd'))

  const submitMutation = useMutation({
    mutationFn: (body: { date: string; activityText: string }) => apiPost('/api/reports', body),
    onSuccess: () => {
      toast.success('Report submitted successfully!')
      setActivityText('')
      queryClient.invalidateQueries({ queryKey: ['my-reports', monthStr] })
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Failed to submit report')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityText.trim()) {
      toast.error('Please describe your activities')
      return
    }
    submitMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      activityText: activityText.trim(),
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Report</h1>
        <p className="text-gray-500 mt-1">Record your daily activities</p>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 font-normal h-10">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (d) {
                        setSelectedDate(d)
                        setIsPopoverOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {existingReport && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Report already exists for this date</p>
                  <p className="mt-0.5 text-amber-600">Go to &quot;My Reports&quot; to edit your existing report.</p>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="activity">What did you do today?</Label>
              <Textarea
                id="activity"
                placeholder="Describe your activities, accomplishments, and any blockers..."
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                rows={8}
                className="resize-none"
                disabled={!!existingReport}
              />
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending || !!existingReport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =====================================================================
// EMPLOYEE: MY REPORTS
// =====================================================================

function EmployeeMyReports() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DailyReport | null>(null)
  const qc = useQueryClient()

  const monthStr = format(currentMonth, 'yyyy-MM')

  const { data: reports = [], isLoading } = useQuery<DailyReport[]>({
    queryKey: ['my-reports', monthStr],
    queryFn: () => apiGet<DailyReport[]>(`/api/reports?month=${monthStr}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, activityText }: { id: string; activityText: string }) =>
      apiPut(`/api/reports/${id}`, { activityText }),
    onSuccess: () => {
      toast.success('Report updated!')
      setEditingReport(null)
      qc.invalidateQueries({ queryKey: ['my-reports', monthStr] })
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/reports/${id}`),
    onSuccess: () => {
      toast.success('Report deleted!')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['my-reports', monthStr] })
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete')
    },
  })

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const openEdit = (report: DailyReport) => {
    setEditingReport(report)
    setEditText(report.activityText)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500 mt-1">View and manage your daily reports</p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold min-w-[160px] text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No reports for this month</p>
            <p className="text-gray-400 text-sm mt-1">Submit your first report for the selected month</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {format(parseISO(report.date), 'EEE, MMM d')}
                          </Badge>
                          <span className="text-xs text-gray-400">{format(parseISO(report.date), 'yyyy')}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                          {report.activityText}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(report)}>
                          <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(report)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Editing report for {editingReport ? format(parseISO(editingReport.date), 'EEEE, MMMM d, yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Activity</Label>
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>Cancel</Button>
            <Button
              onClick={() => editingReport && updateMutation.mutate({ id: editingReport.id, activityText: editText })}
              disabled={updateMutation.isPending || !editText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the report for{' '}
              {deleteTarget ? format(parseISO(deleteTarget.date), 'MMMM d, yyyy') : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

// =====================================================================
// ADMIN: OVERVIEW
// =====================================================================

function AdminOverview() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiGet<AdminStats>('/api/admin/stats'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: <Users className="h-5 w-5" />, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'Active Employees', value: stats.activeEmployees, icon: <UserCheck className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Reports', value: stats.totalReports, icon: <FileText className="h-5 w-5" />, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: "Today's Reports", value: stats.todayReports, icon: <CalendarDays className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "This Month's Reports", value: stats.monthReports, icon: <BarChart3 className="h-5 w-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  const maxDeptCount = Math.max(...stats.departmentStats.map((d) => d.count), 1)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Dashboard statistics & insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="py-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Breakdown</CardTitle>
            <CardDescription>Active employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.departmentStats.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No departments yet</p>
            ) : (
              <div className="space-y-3">
                {stats.departmentStats.map((dept) => (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{dept.department}</span>
                      <span className="text-gray-500">{dept.count}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dept.count / maxDeptCount) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing Today's Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Missing Today&apos;s Reports
            </CardTitle>
            <CardDescription>Employees who haven&apos;t submitted today</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.missingTodayReports.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm text-gray-500 font-medium">All done!</p>
                <p className="text-xs text-gray-400 mt-0.5">Every active employee has reported today.</p>
              </div>
            ) : (
              <ScrollArea className="max-h-56">
                <div className="space-y-2">
                  {stats.missingTodayReports.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <UserCircle className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{emp.username}</p>
                        <p className="text-xs text-gray-400">{emp.profile?.department || 'Unassigned'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Reports</CardTitle>
          <CardDescription>Last 10 submitted reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(parseISO(r.date), 'MMM d')}</TableCell>
                    <TableCell className="text-xs font-medium">{r.user?.username}</TableCell>
                    <TableCell className="text-xs text-gray-500">{r.user?.profile?.department || '-'}</TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[300px] truncate">{r.activityText}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =====================================================================
// ADMIN: EMPLOYEES
// =====================================================================

function AdminEmployees() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  // Add form state
  const [addForm, setAddForm] = useState({ username: '', password: '', employeeId: '', position: '', department: '' })
  // Edit form state
  const [editForm, setEditForm] = useState({ status: '', position: '', department: '', password: '' })

  const { data, isLoading } = useQuery<EmployeesData>({
    queryKey: ['admin-employees', search, departmentFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (departmentFilter !== 'all') params.set('department', departmentFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      return apiGet<EmployeesData>(`/api/admin/employees?${params.toString()}`)
    },
  })

  const addMutation = useMutation({
    mutationFn: (body: typeof addForm) => apiPost('/api/admin/employees', body),
    onSuccess: () => {
      toast.success('Employee added successfully!')
      setAddOpen(false)
      setAddForm({ username: '', password: '', employeeId: '', position: '', department: '' })
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to add employee'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: typeof editForm }) => apiPatch(`/api/admin/employees/${id}`, body),
    onSuccess: () => {
      toast.success('Employee updated!')
      setEditTarget(null)
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/employees/${id}`),
    onSuccess: () => {
      toast.success('Employee deleted!')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete'),
  })

  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setEditForm({
      status: emp.status,
      position: emp.profile?.position || '',
      department: emp.profile?.department || '',
      password: '',
    })
  }

  const employees = data?.employees || []
  const positions = data?.positions || []
  const departments = data?.departments || []

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
      case 'suspended':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Suspended</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Archived</Badge>
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage employee accounts</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white self-start">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      ) : employees.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No employees found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new employee</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-0 px-0">
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Username</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Department</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Position</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-center">Reports</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="text-xs text-gray-500 font-mono">
                        {emp.profile?.employeeId || '-'}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{emp.username}</TableCell>
                      <TableCell className="text-xs text-gray-500 hidden md:table-cell">
                        {emp.profile?.department || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 hidden lg:table-cell">
                        {emp.profile?.position || '-'}
                      </TableCell>
                      <TableCell>{statusBadge(emp.status)}</TableCell>
                      <TableCell className="text-xs text-center">{emp._count?.reports || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(emp)}>
                            <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Create a new employee account</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input
                value={addForm.employeeId}
                onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                placeholder="EMP-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Select value={addForm.position} onValueChange={(v) => setAddForm({ ...addForm, position: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={addForm.department} onValueChange={(v) => setAddForm({ ...addForm, department: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(addForm)}
              disabled={addMutation.isPending || !addForm.username || !addForm.password || !addForm.employeeId || !addForm.position || !addForm.department}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update {editTarget?.username}&apos;s information</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Select value={editForm.position} onValueChange={(v) => setEditForm({ ...editForm, position: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={editForm.department} onValueChange={(v) => setEditForm({ ...editForm, department: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reset Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="New password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              onClick={() => editTarget && editMutation.mutate({ id: editTarget.id, body: editForm })}
              disabled={editMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This will also remove all their reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

// =====================================================================
// ADMIN: REPORTS
// =====================================================================

function AdminReports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [date, setDate] = useState('')
  const [userId, setUserId] = useState('all')
  const [department, setDepartment] = useState('all')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch employees for the dropdown
  const { data: empData } = useQuery<EmployeesData>({
    queryKey: ['admin-employees-list'],
    queryFn: () => apiGet<EmployeesData>('/api/admin/employees'),
  })

  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('limit', '50')
    if (month) p.set('month', month)
    if (date) p.set('date', date)
    if (userId !== 'all') p.set('userId', userId)
    if (department !== 'all') p.set('department', department)
    return p.toString()
  }, [month, date, userId, department, page])

  const { data, isLoading } = useQuery<PaginatedReports>({
    queryKey: ['admin-reports', params],
    queryFn: () => apiGet<PaginatedReports>(`/api/admin/reports?${params}`),
  })

  const reports = data?.reports || []
  const pagination = data?.pagination

  const monthDate = month ? parseISO(month + '-01') : new Date()
  const prevMonth = () => {
    const m = subMonths(monthDate, 1)
    setMonth(format(m, 'yyyy-MM'))
    setPage(1)
  }
  const nextMonth = () => {
    const m = addMonths(monthDate, 1)
    setMonth(format(m, 'yyyy-MM'))
    setPage(1)
  }

  const departments = empData?.departments || []
  const employees = empData?.employees || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">View and filter all employee reports</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Month nav */}
            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-white">
              <button onClick={prevMonth} className="p-0.5 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium min-w-[120px] text-center">{format(monthDate, 'MMMM yyyy')}</span>
              <button onClick={nextMonth} className="p-0.5 hover:bg-gray-100 rounded">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start gap-2 font-normal">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  {date ? format(parseISO(date), 'MMM d, yyyy') : 'Specific date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date ? parseISO(date) : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setDate(format(d, 'yyyy-MM-dd'))
                      setPage(1)
                    }
                  }}
                />
                {date && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setDate(''); setPage(1) }}>
                      Clear date filter
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Employee filter */}
            <Select value={userId} onValueChange={(v) => { setUserId(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Department filter */}
            <Select value={department} onValueChange={(v) => { setDepartment(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="py-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No reports found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-0 px-0">
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Department</TableHead>
                    <TableHead className="text-xs">Activity</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id} className="group">
                      <TableCell className="text-xs">{format(parseISO(r.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-xs font-medium">{r.user?.username || '-'}</TableCell>
                      <TableCell className="text-xs text-gray-500 hidden md:table-cell">
                        {r.user?.profile?.department || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[300px]">
                        <p className={`truncate ${expandedId === r.id ? '' : ''}`}>
                          {r.activityText}
                        </p>
                        {expandedId === r.id && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="text-xs text-gray-700 whitespace-pre-wrap mt-1 leading-relaxed"
                          >
                            {r.activityText}
                          </motion.p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        >
                          {expandedId === r.id ? <ChevronDown className="h-3.5 w-3.5 rotate-180" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          {pagination && pagination.totalPages > 1 && (
            <CardFooter className="border-t py-3 justify-between">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
    </motion.div>
  )
}

// =====================================================================
// ADMIN: EXPORT
// =====================================================================

function AdminExport() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [exporting, setExporting] = useState(false)

  const monthDate = parseISO(month + '-01')

  const handleExport = async () => {
    setExporting(true)
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`/api/admin/export?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Export failed' }))
        toast.error(data.error || 'Export failed')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-reports-${month}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Export downloaded successfully!')
    } catch {
      toast.error('Failed to export reports')
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export Reports</h1>
        <p className="text-gray-500 mt-1">Download monthly reports as Excel file</p>
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Select Month</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setMonth(format(subMonths(monthDate, 1), 'yyyy-MM'))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold min-w-[160px] text-center">{format(monthDate, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setMonth(format(addMonths(monthDate, 1), 'yyyy-MM'))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Export Summary</p>
              <p className="text-xs text-gray-500">
                This will download an Excel file containing all daily reports for <strong>{format(monthDate, 'MMMM yyyy')}</strong>.
                The file includes a summary sheet and a detailed reports sheet.
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =====================================================================
// MAIN HOME (SINGLE PAGE ROUTER)
// =====================================================================

export default function Home() {
  const { isAuthenticated, isAdmin, isInitialized, initialize, logout } = useAuthStore()
  const [employeeView, setEmployeeView] = useState<EmployeeView>('submit')
  const [adminView, setAdminView] = useState<AdminView>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleNavigate = useCallback((view: string) => {
    if (isAdmin) {
      setAdminView(view as AdminView)
    } else {
      setEmployeeView(view as EmployeeView)
    }
  }, [isAdmin])

  const handleLogout = useCallback(() => {
    logout()
    setEmployeeView('submit')
    setAdminView('overview')
  }, [logout])

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center animate-pulse">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Login page
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
        <Toaster position="top-right" richColors theme="light" />
      </QueryClientProvider>
    )
  }

  // Dashboard layout
  const currentView = isAdmin ? adminView : employeeView

  const renderContent = () => {
    if (isAdmin) {
      switch (adminView) {
        case 'overview': return <AdminOverview />
        case 'employees': return <AdminEmployees />
        case 'reports': return <AdminReports />
        case 'export': return <AdminExport />
        default: return <AdminOverview />
      }
    } else {
      switch (employeeView) {
        case 'submit': return <EmployeeSubmitReport />
        case 'my-reports': return <EmployeeMyReports />
        default: return <EmployeeSubmitReport />
      }
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex bg-gray-50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-white">
          <SidebarNavContent
            isAdmin={isAdmin}
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:pl-64">
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 bg-white border-b lg:hidden">
            <div className="flex items-center h-14 px-4 gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <SidebarNavContent
                    isAdmin={isAdmin}
                    currentView={currentView}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                    onClose={() => setMobileMenuOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Daily Report</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>

            {/* Sticky Footer */}
            <footer className="mt-auto pt-8 pb-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Daily Report System &middot; {format(new Date(), 'yyyy')}
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors theme="light" />
    </QueryClientProvider>
  )
}

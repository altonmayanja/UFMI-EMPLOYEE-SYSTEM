'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { format, subMonths, addMonths, parseISO } from 'date-fns'
import {
  FileText, Send, Users, BarChart3, Download,
  ChevronLeft, ChevronRight, LogOut, Menu, Plus, Pencil,
  Trash2, Loader2, CalendarDays, UserCheck, AlertCircle,
  Search, X, CheckCircle2, Clock,
  Building2, Briefcase, UserCircle, Eye, ChevronDown,
  Clapperboard, Shield, Bell, HelpCircle, ArrowRight,
  Lock, Film, LayoutDashboard, ClipboardCheck, CircleUser,
  ChevronUp, Activity, TrendingUp,
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet'

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
  missingTodayReports: { id: string; username: string; profile?: { employeeId?: string; position?: string; department?: string } }[]
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
// NAVIGATION ITEMS
// =====================================================================

const adminNavItems: { key: AdminView; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'employees', label: 'Employees', icon: <Users className="h-4 w-4" /> },
  { key: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
  { key: 'export', label: 'Export', icon: <Download className="h-4 w-4" /> },
]

const employeeNavItems: { key: EmployeeView; label: string; icon: React.ReactNode }[] = [
  { key: 'submit', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'my-reports', label: 'My Reports', icon: <FileText className="h-4 w-4" /> },
]

// =====================================================================
// LOGIN PAGE
// =====================================================================

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiPost<{ token: string; user: User }>('/api/auth/login', { username, password })
      login(data.token, data.user)
      toast.success('Welcome to UFMI Portal!')
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0B1F6D 0%, #0d2478 50%, #132e8a 100%)' }}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header section with branding */}
          <div className="px-8 pt-10 pb-6 text-center" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #ffffff 100%)' }}>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0B1F6D] flex items-center justify-center mb-5 shadow-lg">
              <Clapperboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">UFMI Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Uganda Film Movie Industry Operations</p>
          </div>

          <CardContent className="px-8 pb-8 pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-11 pl-10 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pl-10 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0B1F6D] focus:ring-[#0B1F6D]"
                  />
                  <span className="text-sm text-gray-600">Remember me for 30 days</span>
                </label>
                <button type="button" className="text-sm font-medium text-[#0B1F6D] hover:text-[#1e3a8a] transition-colors">
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Secure Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer links */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
              <button type="button" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B1F6D] transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
                Help Center
              </button>
              <button type="button" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                English
              </button>
            </div>
          </CardContent>

          {/* Security badge */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock className="h-3 w-3" />
              <span className="font-medium tracking-wider">END-TO-END ENCRYPTED GATEWAY</span>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-white/30 mt-6">
          &copy; {new Date().getFullYear()} Uganda Film Movie Industry. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}

// =====================================================================
// SIDEBAR
// =====================================================================

function Sidebar({
  isAdmin,
  currentView,
  onNavigate,
  onLogout,
  collapsed,
  onToggle,
}: {
  isAdmin: boolean
  currentView: string
  onNavigate: (view: string) => void
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
}) {
  const items = isAdmin ? adminNavItems : employeeNavItems
  const user = useAuthStore((s) => s.user)

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '250px',
        background: '#0B1F6D',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Clapperboard className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white leading-none tracking-tight">UFMI Portal</h1>
            <p className="text-[10px] text-blue-300/60 mt-0.5">Operations Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar py-4 px-3 space-y-1">
        {!collapsed && isAdmin && (
          <p className="text-[10px] font-semibold text-blue-300/40 uppercase tracking-wider px-3 mb-2">Navigation</p>
        )}
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
            } ${
              currentView === item.key
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-blue-200/70 hover:bg-white/8 hover:text-white'
            }`}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {isAdmin && (
          <button
            onClick={() => onNavigate('overview')}
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-white bg-[#D94B2B]/90 hover:bg-[#D94B2B] transition-all ${
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
            }`}
            title={collapsed ? 'Submit Report' : undefined}
          >
            <Send className="h-4 w-4" />
            {!collapsed && 'Submit Report'}
          </button>
        )}

        {!collapsed && (
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200/70 hover:bg-white/8 hover:text-white transition-all">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </button>
        )}

        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-red-300/80 hover:bg-red-500/15 hover:text-red-300 transition-all ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white uppercase">
                {(user?.username || 'U').charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-blue-300/50">
                {user?.role === 'admin' ? 'Administrator' : (user?.profile?.position || user?.role)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Copyright */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <p className="text-[9px] text-blue-300/25 leading-tight">
            &copy; {new Date().getFullYear()} Uganda Film Movie Industry
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="h-3 w-3 text-gray-500" /> : <ChevronLeft className="h-3 w-3 text-gray-500" />}
      </button>
    </aside>
  )
}

// =====================================================================
// MOBILE SIDEBAR (Sheet)
// =====================================================================

function MobileSidebar({
  isAdmin,
  currentView,
  onNavigate,
  onLogout,
  open,
  onOpenChange,
}: {
  isAdmin: boolean
  currentView: string
  onNavigate: (view: string) => void
  onLogout: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const items = isAdmin ? adminNavItems : employeeNavItems
  const user = useAuthStore((s) => s.user)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[260px]" style={{ background: '#0B1F6D' }}>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">UFMI Portal</h1>
            <p className="text-[10px] text-blue-300/60 mt-0.5">Operations Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="py-4 px-3 space-y-1">
          {isAdmin && (
            <p className="text-[10px] font-semibold text-blue-300/40 uppercase tracking-wider px-3 mb-2">Navigation</p>
          )}
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); onOpenChange(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === item.key
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <span className="text-xs font-bold text-white uppercase">{(user?.username || 'U').charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-[10px] text-blue-300/50">
                {user?.role === 'admin' ? 'Administrator' : (user?.profile?.position || user?.role)}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300/80 hover:bg-red-500/15 hover:text-red-300 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// =====================================================================
// TOP HEADER BAR
// =====================================================================

function TopHeader({
  onMenuToggle,
  mobileOpen,
  onMobileOpenChange,
  isAdmin,
}: {
  onMenuToggle: () => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  isAdmin: boolean
}) {
  const user = useAuthStore((s) => s.user)

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-white border-b border-gray-200/80 flex items-center px-4 lg:px-6 gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb / Title */}
        <div className="hidden lg:block">
          <p className="text-xs text-gray-400">Portal</p>
          <p className="text-sm font-semibold text-gray-900">UFMI Portal</p>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search operations, assets, or employees..."
              className="h-10 pl-10 rounded-lg border-gray-200 bg-gray-50/50 text-sm focus:bg-white"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="h-4 w-4" />
            {isAdmin && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D94B2B] rounded-full" />
            )}
          </button>
          <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <HelpCircle className="h-4 w-4" />
          </button>

          <Separator orientation="vertical" className="h-8 mx-1 hidden sm:block" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0B1F6D] flex items-center justify-center">
              <span className="text-xs font-bold text-white uppercase">{(user?.username || 'U').charAt(0)}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-none">{user?.username}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {user?.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-[#0B1F6D] text-white text-[9px] font-bold rounded leading-none">ADMIN</span>
                    <span className="ml-0.5">Administrator</span>
                  </span>
                ) : (
                  user?.profile?.position || user?.role
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        isAdmin={isAdmin}
        currentView={isAdmin ? 'overview' : 'submit'}
        onNavigate={() => {}}
        onLogout={() => useAuthStore.getState().logout()}
        open={mobileOpen}
        onOpenChange={onMobileOpenChange}
      />
    </>
  )
}

// =====================================================================
// BREADCRUMB
// =====================================================================

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
          <span className={i === items.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {item}
          </span>
        </span>
      ))}
    </nav>
  )
}

// =====================================================================
// STATUS BADGE HELPER
// =====================================================================

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-50 text-green-700 border-green-200 rounded-full px-2.5 text-xs font-medium">Active</Badge>
    case 'suspended':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-full px-2.5 text-xs font-medium">Suspended</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2.5 text-xs font-medium">Archived</Badge>
  }
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
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!stats) return null

  const pendingReports = stats.activeEmployees - stats.todayReports
  const complianceScore = stats.activeEmployees > 0
    ? Math.round((stats.todayReports / stats.activeEmployees) * 100)
    : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Breadcrumb items={['Portal', 'Dashboard']} />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Operational Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live metrics for the Uganda Film Movie Industry</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 rounded-lg text-xs gap-1.5 border-gray-200">
            <Download className="h-3.5 w-3.5" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className="ufmi-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0B1F6D]/5 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#0B1F6D]" />
              </div>
            </div>
            <Badge className="mt-3 bg-green-50 text-green-700 border-green-200 rounded-full px-2 text-[10px] font-medium">
              +12% from last month
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="ufmi-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeEmployees}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(stats.activeEmployees / Math.max(stats.totalEmployees, 1)) * 100}%` }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="ufmi-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{Math.max(pendingReports, 0)}</p>
              </div>
              <Badge className="bg-[#D94B2B]/10 text-[#D94B2B] rounded-full px-2.5 text-[10px] font-bold mt-1">
                URGENT
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-3">{stats.todayReports} of {stats.activeEmployees} submitted today</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="ufmi-card-dark p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-200/60">Compliance Score</p>
                <p className="text-3xl font-bold text-white mt-1">{complianceScore}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#F4B400] rounded-full transition-all" style={{ width: `${complianceScore}%` }} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="ufmi-card p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">Department Breakdown</h2>
            <p className="text-sm text-gray-500 mt-0.5">Active employees by department</p>
          </div>
          {stats.departmentStats.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No departments yet</p>
          ) : (
            <div className="space-y-4">
              {stats.departmentStats.map((dept) => {
                const maxDeptCount = Math.max(...stats.departmentStats.map((d) => d.count), 1)
                return (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{dept.department}</span>
                      <span className="text-gray-500 text-xs">{dept.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dept.count / maxDeptCount) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-[#0B1F6D] rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Missing Today's Reports */}
        <div className="ufmi-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                Missing Today&apos;s Reports
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Employees who haven&apos;t submitted</p>
            </div>
            {stats.missingTodayReports.length > 0 && (
              <Badge className="bg-[#D94B2B]/10 text-[#D94B2B] rounded-full px-2.5 text-xs font-bold">
                {stats.missingTodayReports.length}
              </Badge>
            )}
          </div>
          {stats.missingTodayReports.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 className="h-10 w-10 text-green-400 mb-2" />
              <p className="text-sm text-gray-500 font-medium">All reports submitted</p>
              <p className="text-xs text-gray-400 mt-0.5">Every active employee has reported today.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[240px]">
              <div className="space-y-1">
                {stats.missingTodayReports.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#0B1F6D]/5 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#0B1F6D] uppercase">{emp.username.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{emp.username}</p>
                      <p className="text-xs text-gray-400">{emp.profile?.position || 'Unassigned'} &middot; {emp.profile?.department || 'Unassigned'}</p>
                    </div>
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="ufmi-card p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Recent Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Last 10 submitted reports</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <Table>
            <TableHeader className="ufmi-table-header bg-gray-50/80">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="hidden md:table-cell">Position</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead>Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentReports.map((r) => (
                <TableRow key={r.id} className="border-b border-gray-50 last:border-0">
                  <TableCell className="text-sm text-gray-600">{format(parseISO(r.date), 'MMM d')}</TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">{r.user?.username}</TableCell>
                  <TableCell className="text-sm text-gray-500 hidden md:table-cell">{r.user?.profile?.position || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-500 hidden lg:table-cell">{r.user?.profile?.department || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[280px] truncate">{r.activityText}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
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
  const hasTodayReport = reports.find((r) => r.date === format(today, 'yyyy-MM-dd'))

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

  const user = useAuthStore((s) => s.user)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Breadcrumb items={['Operations', 'Reports', 'Daily Submission']} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Daily Activity Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">Record your daily work activities and accomplishments</p>
      </div>

      {/* Alert banner if no today report */}
      {!hasTodayReport && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 rounded-xl bg-[#D94B2B]/5 border border-[#D94B2B]/15 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D94B2B]/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-[#D94B2B]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#D94B2B]">You have not submitted today&apos;s report</p>
              <p className="text-xs text-[#D94B2B]/60 mt-0.5">Please submit your daily activity report before the deadline.</p>
            </div>
          </div>
          <Button size="sm" className="bg-[#D94B2B] hover:bg-[#c4411f] text-white rounded-lg shrink-0">
            Submit Now
          </Button>
        </motion.div>
      )}

      {/* Welcome card */}
      <div className="ufmi-card-dark p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-blue-200/50">{format(today, 'EEEE, MMMM d, yyyy')}</p>
            <h2 className="text-lg font-bold text-white mt-1">
              Welcome back, {user?.username}
            </h2>
            <p className="text-sm text-blue-200/60 mt-0.5">
              {user?.profile?.position} &middot; {user?.profile?.department}
            </p>
          </div>
          <Button
            className="bg-white text-[#0B1F6D] hover:bg-gray-100 rounded-lg font-medium"
            onClick={() => document.getElementById('report-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Daily Report
          </Button>
        </div>
      </div>

      {/* Report form */}
      <div id="report-form" className="ufmi-card p-6 max-w-3xl">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Report Details</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Reporting Date</Label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 font-normal h-10 rounded-lg border-gray-200 bg-gray-50/50">
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
            <Label htmlFor="activity" className="text-sm font-medium text-gray-700">
              Detailed Activity Log
            </Label>
            <Textarea
              id="activity"
              placeholder="Describe your activities, accomplishments, and any blockers..."
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              rows={8}
              className="resize-none rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
              disabled={!!existingReport}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 text-right">{activityText.length}/2000 characters</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitMutation.isPending || !!existingReport}
              className="bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white rounded-lg font-medium"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="rounded-lg border-gray-200">
              Save Draft
            </Button>
          </div>
        </form>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-[#0B1F6D]" />
            <p className="text-xs font-semibold text-[#0B1F6D]">Deadline</p>
          </div>
          <p className="text-xs text-gray-500">Reports should be submitted by 6:00 PM daily</p>
        </div>
        <div className="rounded-xl bg-green-50/50 border border-green-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="h-4 w-4 text-green-700" />
            <p className="text-xs font-semibold text-green-700">Compliance</p>
          </div>
          <p className="text-xs text-gray-500">Consistent reporting is tracked for performance review</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-gray-600" />
            <p className="text-xs font-semibold text-gray-600">Privacy</p>
          </div>
          <p className="text-xs text-gray-500">Reports are confidential and accessible only to authorized personnel</p>
        </div>
      </div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Breadcrumb items={['Operations', 'My Reports']} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Recent Submissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage your daily reports</p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-lg border-gray-200 h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[160px] text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-lg border-gray-200 h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="ufmi-card border-dashed flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No reports for this month</p>
          <p className="text-gray-400 text-sm mt-1">Submit your first report for the selected month</p>
        </div>
      ) : (
        <div className="ufmi-card overflow-hidden">
          <Table>
            <TableHeader className="ufmi-table-header bg-gray-50/80">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Report Subject</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="border-b border-gray-50 last:border-0">
                  <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                    {format(parseISO(report.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 max-w-[400px] truncate">
                    {report.activityText.substring(0, 60)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-green-50 text-green-700 border-green-200 rounded-full px-2.5 text-xs font-medium">
                      Submitted
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(report)}>
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(report)}>
                        <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-[#D94B2B]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <button className="text-sm font-medium text-[#0B1F6D] hover:text-[#1e3a8a] transition-colors">
        View Full Report History
      </button>

      {/* Edit Dialog */}
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent className="rounded-2xl">
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
              className="resize-none rounded-lg border-gray-200"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)} className="rounded-lg border-gray-200">Cancel</Button>
            <Button
              onClick={() => editingReport && updateMutation.mutate({ id: editingReport.id, activityText: editText })}
              disabled={updateMutation.isPending || !editText.trim()}
              className="bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white rounded-lg"
            >
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
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
              className="bg-[#D94B2B] hover:bg-[#c4411f] text-white rounded-lg"
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

  const [addForm, setAddForm] = useState({ username: '', password: '', employeeId: '', position: '', department: '' })
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

  const activeCount = employees.filter(e => e.status === 'active').length
  const suspendedCount = employees.filter(e => e.status === 'suspended').length
  const archivedCount = employees.filter(e => e.status === 'archived').length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Breadcrumb items={['Portal', 'Workforce Management']} />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Employee Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage employee accounts and access</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 rounded-lg text-xs gap-1.5 border-gray-200">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-medium gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Employee
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="ufmi-card p-4">
          <p className="text-xs text-gray-500">Total Employees</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{employees.length}</p>
        </div>
        <div className="ufmi-card p-4">
          <p className="text-xs text-gray-500">Active Roles</p>
          <p className="text-xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="ufmi-card p-4">
          <p className="text-xs text-gray-500">Suspended</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{suspendedCount}</p>
        </div>
        <div className="ufmi-card p-4">
          <p className="text-xs text-gray-500">Archived</p>
          <p className="text-xl font-bold text-gray-400 mt-1">{archivedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ufmi-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID, or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-lg border-gray-200 text-sm"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-lg text-sm border-gray-200">
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
            <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg text-sm border-gray-200">
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
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="ufmi-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="ufmi-card border-dashed flex flex-col items-center py-16">
          <Users className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No employees found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new employee</p>
        </div>
      ) : (
        <div className="ufmi-card overflow-hidden">
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader className="ufmi-table-header bg-gray-50/80">
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Position</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className="border-b border-gray-50 last:border-0">
                    <TableCell className="text-sm text-gray-500 font-mono text-xs">
                      {emp.profile?.employeeId || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0B1F6D]/5 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[#0B1F6D] uppercase">{emp.username.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{emp.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 hidden md:table-cell">
                      {emp.profile?.position || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 hidden lg:table-cell">
                      {emp.profile?.department || '-'}
                    </TableCell>
                    <TableCell><StatusBadge status={emp.status} /></TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{emp._count?.reports || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
                          <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(emp)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-[#D94B2B]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Employee</DialogTitle>
            <DialogDescription>Add a new employee to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Username</Label>
              <Input
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                placeholder="johndoe"
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Password</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Enter password"
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Employee ID</Label>
              <Input
                value={addForm.employeeId}
                onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                placeholder="EMP-001"
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Position</Label>
              <Select value={addForm.position} onValueChange={(v) => setAddForm({ ...addForm, position: v })}>
                <SelectTrigger className="w-full rounded-lg border-gray-200">
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
              <Label className="text-sm">Department</Label>
              <Select value={addForm.department} onValueChange={(v) => setAddForm({ ...addForm, department: v })}>
                <SelectTrigger className="w-full rounded-lg border-gray-200">
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
            <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-lg border-gray-200">Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(addForm)}
              disabled={addMutation.isPending || !addForm.username || !addForm.password || !addForm.employeeId || !addForm.position || !addForm.department}
              className="bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white rounded-lg"
            >
              {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update {editTarget?.username}&apos;s information</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="w-full rounded-lg border-gray-200">
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
              <Label className="text-sm">Position</Label>
              <Select value={editForm.position} onValueChange={(v) => setEditForm({ ...editForm, position: v })}>
                <SelectTrigger className="w-full rounded-lg border-gray-200">
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
              <Label className="text-sm">Department</Label>
              <Select value={editForm.department} onValueChange={(v) => setEditForm({ ...editForm, department: v })}>
                <SelectTrigger className="w-full rounded-lg border-gray-200">
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
              <Label className="text-sm">Reset Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="New password"
                className="rounded-lg border-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} className="rounded-lg border-gray-200">Cancel</Button>
            <Button
              onClick={() => editTarget && editMutation.mutate({ id: editTarget.id, body: editForm })}
              disabled={editMutation.isPending}
              className="bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white rounded-lg"
            >
              {editMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
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
              className="bg-[#D94B2B] hover:bg-[#c4411f] text-white rounded-lg"
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Breadcrumb items={['Portal', 'Reports']} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">All Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and filter all employee reports</p>
      </div>

      {/* Filters */}
      <div className="ufmi-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Month nav */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-white border-gray-200">
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
              <Button variant="outline" className="w-full sm:w-auto justify-start gap-2 font-normal h-9 rounded-lg border-gray-200 text-sm">
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

          <Select value={userId} onValueChange={(v) => { setUserId(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-lg text-sm border-gray-200">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={department} onValueChange={(v) => { setDepartment(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-lg text-sm border-gray-200">
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
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="ufmi-card p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="ufmi-card border-dashed flex flex-col items-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No reports found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="ufmi-card overflow-hidden">
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader className="ufmi-table-header bg-gray-50/80">
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Position</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="border-b border-gray-50 last:border-0 group">
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {format(parseISO(r.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">{r.user?.username || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-500 hidden md:table-cell">
                      {r.user?.profile?.position || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 hidden lg:table-cell">
                      {r.user?.profile?.department || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[300px]">
                      {expandedId === r.id ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{r.activityText}</p>
                      ) : (
                        <p className="truncate">{r.activityText}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      >
                        {expandedId === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)} className="rounded-lg border-gray-200 h-8">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)} className="rounded-lg border-gray-200 h-8">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Breadcrumb items={['Portal', 'Export']} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Export Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Download monthly reports as Excel file</p>
      </div>

      <div className="ufmi-card p-6 max-w-lg">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Select Month</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setMonth(format(subMonths(monthDate, 1), 'yyyy-MM'))} className="rounded-lg border-gray-200 h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[160px] text-center">{format(monthDate, 'MMMM yyyy')}</span>
              <Button variant="outline" size="icon" onClick={() => setMonth(format(addMonths(monthDate, 1), 'yyyy-MM'))} className="rounded-lg border-gray-200 h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-[#0B1F6D]/3 border border-[#0B1F6D]/10 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0B1F6D]" />
              <p className="text-sm font-semibold text-[#0B1F6D]">Export Summary</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              This will download an Excel file containing all daily reports for <strong>{format(monthDate, 'MMMM yyyy')}</strong>.
              The file includes a summary sheet and a detailed reports sheet.
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-[#0B1F6D] hover:bg-[#1e3a8a] text-white rounded-lg font-medium h-11"
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
      </div>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1F6D' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-blue-200/50">Loading...</p>
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
      <div className="min-h-screen bg-[#F5F7FA]">
        {/* Sidebar */}
        <Sidebar
          isAdmin={isAdmin}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main area */}
        <div
          className="transition-all duration-300 min-h-screen flex flex-col"
          style={{ marginLeft: '0' }}
        >
          {/* Spacer for sidebar on desktop */}
          <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-[250px] pointer-events-none" style={{ width: sidebarCollapsed ? '72px' : '250px' }} />
          <div className="lg:ml-[250px] flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: undefined }} 
            ref={(el) => { if (el) el.style.marginLeft = '' }}
          >
            {/* Use CSS for the margin instead */}
            <style>{`
              @media (min-width: 1024px) {
                .main-content-area { margin-left: ${sidebarCollapsed ? '72px' : '250px'}; }
              }
            `}</style>
          </div>
          
          <div className="main-content-area flex flex-col min-h-screen">
            {/* Top Header */}
            <TopHeader
              onMenuToggle={() => setMobileOpen(!mobileOpen)}
              mobileOpen={mobileOpen}
              onMobileOpenChange={setMobileOpen}
              isAdmin={isAdmin}
            />

            {/* Content */}
            <main className="flex-1 p-4 lg:p-6">
              <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200/80 bg-white px-4 lg:px-6 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} UFMI Enterprise. All rights reserved.</p>
                <p className="text-xs text-gray-400 hidden sm:block">Uganda Film Movie Industry Operations Portal</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
      <Toaster position="top-right" richColors theme="light" />
    </QueryClientProvider>
  )
}

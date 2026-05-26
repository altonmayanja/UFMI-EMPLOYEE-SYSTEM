/**
 * UFMI Daily Report Reminder Service
 *
 * Runs on a cron schedule (every weekday at configurable times).
 * Checks which active employees haven't submitted today's report
 * and creates notification reminders for them.
 *
 * Also runs a daily compliance summary for admins at end of day.
 */

import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

const prisma = new PrismaClient()

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const REMINDER_HOURS = [9, 14, 16] // 9 AM, 2 PM, 4 PM (EAT)
const SUMMARY_HOUR = 18 // 6 PM daily summary for admin

function getEATNow(): Date {
  const now = new Date()
  // EAT = UTC+3
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 3 * 3600000)
}

function getEATDateString(eatDate: Date): string {
  return format(eatDate, 'yyyy-MM-dd')
}

function isWeekday(eatDate: Date): boolean {
  const day = eatDate.getDay()
  return day !== 0 && day !== 6
}

// ══════════════════════════════════════════════════════════════
// REMINDER LOGIC
// ══════════════════════════════════════════════════════════════

async function sendDailyReminder(hour: number) {
  const eatNow = getEATNow()
  const todayStr = getEATDateString(eatNow)

  console.log(`[${new Date().toISOString()}] Running reminder check at ${hour}:00 EAT (today=${todayStr}, weekday=${isWeekday(eatNow)})`)

  if (!isWeekday(eatNow)) {
    console.log('  → Skipping: weekend')
    return
  }

  try {
    // Get all active employees
    const employees = await prisma.user.findMany({
      where: {
        role: 'employee',
        status: 'active',
      },
      select: { id: true, username: true },
    })

    if (employees.length === 0) {
      console.log('  → No active employees found')
      return
    }

    // Check which already submitted today
    const todayReports = await prisma.dailyReport.findMany({
      where: { date: todayStr },
      select: { userId: true },
    })

    const submittedUserIds = new Set(todayReports.map((r) => r.userId))
    const missingEmployees = employees.filter((e) => !submittedUserIds.has(e.id))

    if (missingEmployees.length === 0) {
      console.log(`  → All ${employees.length} employees have submitted today!`)
      return
    }

    // Don't send duplicate reminders — check if a reminder was already sent today at this hour
    for (const emp of missingEmployees) {
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: emp.id,
          type: 'reminder',
          title: { contains: 'Daily Report Reminder' },
          createdAt: {
            gte: new Date(eatNow.getTime() - 3600000), // within last hour
          },
        },
      })

      if (existingReminder) {
        console.log(`  → Skipping ${emp.username}: already reminded recently`)
        continue
      }

      // Create personalized reminder
      let reminderMessage: string
      if (hour === 9) {
        reminderMessage = `Good morning! Please remember to submit your daily activity report for today (${todayStr}). Reports should be submitted by 6:00 PM. Your consistent reporting helps us track operational progress.`
      } else if (hour === 14) {
        reminderMessage = `Friendly reminder: You haven't submitted your daily activity report yet today. Please submit it before 6:00 PM. Include your activities, location, time in/out, and any comments.`
      } else {
        reminderMessage = `⚠️ Final reminder: Your daily activity report for today (${todayStr}) is due soon! The deadline is 6:00 PM. Please submit it now to maintain your reporting streak.`
      }

      await prisma.notification.create({
        data: {
          userId: emp.id,
          title: 'Daily Report Reminder',
          message: reminderMessage,
          type: 'warning',
        },
      })

      console.log(`  → Reminder sent to ${emp.username}`)
    }

    console.log(`  → Sent reminders to ${missingEmployees.length} employee(s) who haven't submitted today`)
  } catch (error) {
    console.error('Error sending reminders:', error)
  }
}

async function sendDailySummary() {
  const eatNow = getEATNow()
  const todayStr = getEATDateString(eatNow)

  console.log(`[${new Date().toISOString()}] Running daily summary for ${todayStr}`)

  if (!isWeekday(eatNow)) {
    console.log('  → Skipping: weekend')
    return
  }

  try {
    const employees = await prisma.user.findMany({
      where: { role: 'employee', status: 'active' },
      select: { id: true, username: true },
    })

    const todayReports = await prisma.dailyReport.findMany({
      where: { date: todayStr },
      select: { userId: true },
    })

    const submittedUserIds = new Set(todayReports.map((r) => r.userId))
    const submitted = employees.filter((e) => submittedUserIds.has(e.id))
    const missing = employees.filter((e) => !submittedUserIds.has(e.id))
    const complianceRate = employees.length > 0
      ? Math.round((submitted.length / employees.length) * 100)
      : 0

    // Send summary to admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin', status: 'active' },
      select: { id: true },
    })

    const summaryMessage =
      `📊 Daily Report Summary for ${todayStr}\n\n` +
      `✅ Submitted: ${submitted.length} employees\n` +
      `❌ Missing: ${missing.length} employees\n` +
      `📈 Compliance Rate: ${complianceRate}%\n\n` +
      (missing.length > 0
        ? `Missing employees: ${missing.map((e) => e.username).join(', ')}`
        : 'All employees submitted their reports today! 🎉')

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `Daily Report Summary - ${todayStr}`,
          message: summaryMessage,
          type: complianceRate >= 80 ? 'success' : complianceRate >= 50 ? 'info' : 'warning',
        },
      })
    }

    console.log(`  → Summary sent to ${admins.length} admin(s): ${submitted.length}/${employees.length} submitted (${complianceRate}%)`)
  } catch (error) {
    console.error('Error sending daily summary:', error)
  }
}

// ══════════════════════════════════════════════════════════════
// MANUAL TRIGGER ENDPOINTS (HTTP API)
// ══════════════════════════════════════════════════════════════

const server = Bun.serve({
  port: 3010,
  async fetch(req) {
    const url = new URL(req.url)

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'ufmi-reminder-service', eatTime: getEATNow().toISOString() })
    }

    // Manual trigger: send reminders now
    if (url.pathname === '/trigger/remind' && req.method === 'POST') {
      const hour = parseInt(url.searchParams.get('hour') || `${REMINDER_HOURS[REMINDER_HOURS.length - 1]}`, 10)
      sendDailyReminder(hour)
      return Response.json({ triggered: true, hour, message: `Reminder check initiated for ${hour}:00 EAT` })
    }

    // Manual trigger: send daily summary
    if (url.pathname === '/trigger/summary' && req.method === 'POST') {
      sendDailySummary()
      return Response.json({ triggered: true, message: 'Daily summary initiated' })
    }

    // Status
    if (url.pathname === '/') {
      return Response.json({
        service: 'UFMI Reminder Service',
        version: '1.0.0',
        status: 'running',
        reminderHours: REMINDER_HOURS,
        summaryHour: SUMMARY_HOUR,
        timezone: 'EAT (UTC+3)',
        endpoints: {
          health: 'GET /health',
          triggerRemind: 'POST /trigger/remind?hour=16',
          triggerSummary: 'POST /trigger/summary',
        },
      })
    }

    return Response.json({ error: 'Not found' }, { status: 404 })
  },
})

console.log(`🔔 UFMI Reminder Service running on port ${server.port}`)

// ══════════════════════════════════════════════════════════════
// CRON SCHEDULER
// ══════════════════════════════════════════════════════════════

function scheduleNextCheck() {
  const eatNow = getEATNow()
  const currentHour = eatNow.getHours()
  const currentMinute = eatNow.getMinutes()

  // Find the next scheduled time
  let nextHour = REMINDER_HOURS.find((h) => h > currentHour) || REMINDER_HOURS[0]
  let isNextDay = nextHour <= currentHour || (nextHour === currentHour && currentMinute >= 1)

  // Also check summary hour
  if (SUMMARY_HOUR > currentHour && (!nextHour || SUMMARY_HOUR < nextHour || nextHour <= currentHour)) {
    nextHour = SUMMARY_HOUR
    isNextDay = false
  }

  const delayMs = isNextDay
    ? ((24 - currentHour + nextHour) * 3600000) + (1 - currentMinute) * 60000
    : ((nextHour - currentHour) * 3600000) + (1 - currentMinute) * 60000

  console.log(`  ⏰ Next check in ${Math.round(delayMs / 60000)} minutes (target: ${nextHour}:00 EAT)`)

  setTimeout(async () => {
    const eatAtRun = getEATNow()
    const runHour = eatAtRun.getHours()

    // Run appropriate check
    if (runHour === SUMMARY_HOUR) {
      sendDailySummary()
    } else if (REMINDER_HOURS.includes(runHour)) {
      sendDailyReminder(runHour)
    }

    // Schedule next
    scheduleNextCheck()
  }, delayMs)
}

// Start the cron scheduler
scheduleNextCheck()

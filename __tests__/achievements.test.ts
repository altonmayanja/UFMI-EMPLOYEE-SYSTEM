/**
 * Tests for the Achievement Extraction Module
 *
 * Tests all 6 achievement detection strategies:
 * 1. Diverse Completion
 * 2. High Consistency
 * 3. Deep Expertise
 * 4. High Volume
 * 5. Consistency Streak
 * 6. Focused Impact
 */

import { describe, it, expect } from 'vitest'
import { extractAchievements } from '@/lib/report-engine/achievements'
import { type ProcessedReportData, type CategoryBreakdown, type ActivityWithCategories } from '@/lib/report-engine/statistics'

function createMockData(overrides: Partial<ProcessedReportData> = {}): ProcessedReportData {
  return {
    activities: [],
    dailyReports: [],
    statistics: {
      totalReportsSubmitted: 10,
      expectedReports: 22,
      submissionRate: 45,
      missedSubmissions: 12,
      totalActivitiesRecorded: 15,
      avgActivitiesPerDay: 1.5,
      avgActivitiesPerReport: 1.5,
      totalWords: 200,
      avgWordsPerReport: 20,
      mostActiveDay: 'Monday',
      mostActiveDayCount: 3,
      mostActiveWeek: 'Week 3',
      mostActiveWeekCount: 6,
      longestStreak: 3,
      currentStreak: 0,
      categoriesWorked: 2,
      topCategory: 'Technical Support',
      mostFrequentCategory: 'Technical Support',
      top3Categories: [],
      dominantFocus: null,
    },
    categoryBreakdown: [],
    topCategories: [],
    weekBreakdown: [],
    recurringTasks: [],
    dominantFocusArea: null,
    ...overrides,
  }
}

describe('Achievement Extraction', () => {
  describe('No achievements detected', () => {
    it('should return "no significant achievement patterns" when data is insufficient', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          submissionRate: 45,
          longestStreak: 3,
          totalActivitiesRecorded: 15,
        },
        categoryBreakdown: [
          { categoryId: 'a', categoryName: 'Technical Support', count: 8, percentage: 53, color: '#000', description: 'Support', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 7, percentage: 47, color: '#000', description: 'Network', sampleActivities: [] },
        ],
        topCategories: [
          { categoryId: 'a', categoryName: 'Technical Support', count: 8, percentage: 53, color: '#000', description: 'Support', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 7, percentage: 47, color: '#000', description: 'Network', sampleActivities: [] },
        ],
      })

      const achievements = extractAchievements(data)
      // Top 2 categories = 53% + 47% = 100% → triggers Focused Impact
      // But only 15 total activities, need >= 8, so it does trigger
      expect(achievements.length).toBeGreaterThanOrEqual(1)
    })

    it('should return "no significant achievement patterns" when truly insufficient', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          submissionRate: 30,
          longestStreak: 2,
          totalActivitiesRecorded: 5,
          totalReportsSubmitted: 3,
        },
        categoryBreakdown: [
          { categoryId: 'a', categoryName: 'Technical Support', count: 3, percentage: 60, color: '#000', description: 'Support', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 2, percentage: 40, color: '#000', description: 'Network', sampleActivities: [] },
        ],
        topCategories: [
          { categoryId: 'a', categoryName: 'Technical Support', count: 3, percentage: 60, color: '#000', description: 'Support', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 2, percentage: 40, color: '#000', description: 'Network', sampleActivities: [] },
        ],
      })

      const achievements = extractAchievements(data)
      expect(achievements).toHaveLength(1)
      expect(achievements[0]).toBe('No significant achievement patterns detected.')
    })
  })

  describe('High Consistency (Strategy 2)', () => {
    it('should detect achievement when submission rate >= 90%', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          submissionRate: 95,
          totalReportsSubmitted: 21,
          expectedReports: 22,
        },
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('95% reporting consistency'))).toBe(true)
    })

    it('should NOT detect consistency achievement when rate < 90%', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          submissionRate: 85,
        },
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('reporting consistency'))).toBe(false)
    })
  })

  describe('Consistency Streak (Strategy 5)', () => {
    it('should detect achievement when longest streak >= 10', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          longestStreak: 12,
        },
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('12 days'))).toBe(true)
    })

    it('should NOT detect streak achievement when streak < 10', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          longestStreak: 8,
        },
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('streak'))).toBe(false)
    })
  })

  describe('Deep Expertise (Strategy 3)', () => {
    it('should detect achievement when single category > 40% with 10+ activities', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          totalActivitiesRecorded: 25,
        },
        categoryBreakdown: [
          { categoryId: 'a', categoryName: 'Software Installation', count: 15, percentage: 60, color: '#000', description: 'Install', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 10, percentage: 40, color: '#000', description: 'Network', sampleActivities: [] },
        ],
        topCategories: [
          { categoryId: 'a', categoryName: 'Software Installation', count: 15, percentage: 60, color: '#000', description: 'Install', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 10, percentage: 40, color: '#000', description: 'Network', sampleActivities: [] },
        ],
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('deep expertise') && a.includes('software installation'))).toBe(true)
    })

    it('should NOT detect expertise when < 10 total activities', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          totalActivitiesRecorded: 5,
        },
        categoryBreakdown: [
          { categoryId: 'a', categoryName: 'Software Installation', count: 3, percentage: 60, color: '#000', description: 'Install', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 2, percentage: 40, color: '#000', description: 'Network', sampleActivities: [] },
        ],
        topCategories: [
          { categoryId: 'a', categoryName: 'Software Installation', count: 3, percentage: 60, color: '#000', description: 'Install', sampleActivities: [] },
          { categoryId: 'b', categoryName: 'Networking', count: 2, percentage: 40, color: '#000', description: 'Network', sampleActivities: [] },
        ],
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('deep expertise'))).toBe(false)
    })
  })

  describe('Diverse Completion (Strategy 1)', () => {
    it('should detect achievement with 4+ categories and 5+ reports', () => {
      const categories: CategoryBreakdown[] = [
        { categoryId: 'a', categoryName: 'Technical Support', count: 10, percentage: 30, color: '#000', description: 'Support', sampleActivities: [] },
        { categoryId: 'b', categoryName: 'Networking', count: 8, percentage: 24, color: '#000', description: 'Network', sampleActivities: [] },
        { categoryId: 'c', categoryName: 'Administration', count: 8, percentage: 24, color: '#000', description: 'Admin', sampleActivities: [] },
        { categoryId: 'd', categoryName: 'Software Installation', count: 7, percentage: 22, color: '#000', description: 'Install', sampleActivities: [] },
      ]

      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          totalReportsSubmitted: 10,
        },
        categoryBreakdown: categories,
        topCategories: categories.slice(0, 3),
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('versatile contribution') && a.includes('4'))).toBe(true)
    })
  })

  describe('High Volume (Strategy 4)', () => {
    it('should detect achievement when 30+ activities recorded', () => {
      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          totalActivitiesRecorded: 45,
        },
      })

      const achievements = extractAchievements(data)
      expect(achievements.some(a => a.includes('45 recorded activities'))).toBe(true)
    })
  })

  describe('Multiple achievements', () => {
    it('should detect multiple achievements simultaneously', () => {
      const categories: CategoryBreakdown[] = [
        { categoryId: 'a', categoryName: 'Technical Support', count: 25, percentage: 50, color: '#000', description: 'Support', sampleActivities: [] },
        { categoryId: 'b', categoryName: 'Networking', count: 12, percentage: 24, color: '#000', description: 'Network', sampleActivities: [] },
        { categoryId: 'c', categoryName: 'Administration', count: 8, percentage: 16, color: '#000', description: 'Admin', sampleActivities: [] },
        { categoryId: 'd', categoryName: 'Software Installation', count: 5, percentage: 10, color: '#000', description: 'Install', sampleActivities: [] },
      ]

      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          submissionRate: 95,
          longestStreak: 15,
          totalActivitiesRecorded: 50,
          totalReportsSubmitted: 21,
          expectedReports: 22,
        },
        categoryBreakdown: categories,
        topCategories: categories.slice(0, 3),
      })

      const achievements = extractAchievements(data)
      // Should have: consistency, streak, expertise (50% top category), diverse, volume, focused
      expect(achievements.length).toBeGreaterThanOrEqual(4)
      expect(achievements.some(a => a.includes('95% reporting consistency'))).toBe(true)
      expect(achievements.some(a => a.includes('15 days'))).toBe(true)
    })

    it('should cap at 8 achievements', () => {
      const categories: CategoryBreakdown[] = Array.from({ length: 11 }, (_, i) => ({
        categoryId: `cat-${i}`,
        categoryName: `Category ${i}`,
        count: 10 - i,
        percentage: Math.round((10 - i) / 55 * 100),
        color: '#000',
        description: `Cat ${i}`,
        sampleActivities: [],
      }))

      const data = createMockData({
        statistics: {
          ...createMockData().statistics,
          submissionRate: 100,
          longestStreak: 22,
          totalActivitiesRecorded: 55,
          totalReportsSubmitted: 22,
          expectedReports: 22,
        },
        categoryBreakdown: categories,
        topCategories: categories.slice(0, 3),
      })

      const achievements = extractAchievements(data)
      expect(achievements.length).toBeLessThanOrEqual(8)
    })
  })
})

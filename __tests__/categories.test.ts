/**
 * Tests for the Category Classification Engine
 */

import { describe, it, expect } from 'vitest'
import { DEFAULT_CATEGORIES, classifyActivity, getPrimaryCategory } from '@/lib/report-engine/categories'

describe('Category Classification', () => {
  describe('classifyActivity', () => {
    it('should return empty array for text with no keywords', () => {
      const result = classifyActivity('had a regular workday', DEFAULT_CATEGORIES)
      expect(result).toHaveLength(0)
    })

    it('should classify "troubleshoot network issue" as Technical Support + Networking', () => {
      const result = classifyActivity('troubleshoot network issue', DEFAULT_CATEGORIES)
      const ids = result.map(c => c.id)
      expect(ids).toContain('technical-support')
      expect(ids).toContain('networking')
    })

    it('should classify "installed new software" as Software Installation', () => {
      const result = classifyActivity('installed new software on production computers', DEFAULT_CATEGORIES)
      const ids = result.map(c => c.id)
      expect(ids).toContain('software-installation')
    })

    it('should classify training-related activities', () => {
      const result = classifyActivity('attended training workshop on cybersecurity', DEFAULT_CATEGORIES)
      const ids = result.map(c => c.id)
      expect(ids).toContain('training')
      expect(ids).toContain('security')
    })

    it('should classify maintenance activities', () => {
      const result = classifyActivity('performed routine maintenance on office equipment', DEFAULT_CATEGORIES)
      const ids = result.map(c => c.id)
      expect(ids).toContain('maintenance')
    })

    it('should be case-insensitive', () => {
      const result1 = classifyActivity('Installed Software', DEFAULT_CATEGORIES)
      const result2 = classifyActivity('installed software', DEFAULT_CATEGORIES)
      expect(result1.map(c => c.id)).toEqual(result2.map(c => c.id))
    })

    it('should classify research activities', () => {
      const result = classifyActivity('conducted research on new technologies', DEFAULT_CATEGORIES)
      const ids = result.map(c => c.id)
      expect(ids).toContain('research')
    })
  })

  describe('getPrimaryCategory', () => {
    it('should return the category with the most keyword matches', () => {
      // "installed new software and configured the network connection"
      // Software Installation: install, installed, software, configure, configuration
      // Networking: network, connection
      const result = getPrimaryCategory('installed new software and configured the network connection', DEFAULT_CATEGORIES)
      expect(result?.id).toBe('software-installation')
    })

    it('should return null for text with no matching categories', () => {
      const result = getPrimaryCategory('had lunch at the cafeteria', DEFAULT_CATEGORIES)
      expect(result).toBeNull()
    })

    it('should break ties by category order (first defined wins)', () => {
      // "resolve" appears in Technical Support
      // If tied, Technical Support should win (defined first)
      const result = getPrimaryCategory('resolve the access issue', DEFAULT_CATEGORIES)
      expect(result?.id).toBe('technical-support')
    })
  })

  describe('DEFAULT_CATEGORIES', () => {
    it('should have exactly 11 categories', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(11)
    })

    it('should have all required categories', () => {
      const ids = DEFAULT_CATEGORIES.map(c => c.id)
      expect(ids).toContain('technical-support')
      expect(ids).toContain('software-installation')
      expect(ids).toContain('networking')
      expect(ids).toContain('administration')
      expect(ids).toContain('production-support')
      expect(ids).toContain('data-management')
      expect(ids).toContain('communication')
      expect(ids).toContain('security')
      expect(ids).toContain('training')
      expect(ids).toContain('research')
      expect(ids).toContain('maintenance')
    })

    it('should have keywords for every category', () => {
      for (const cat of DEFAULT_CATEGORIES) {
        expect(cat.keywords.length).toBeGreaterThan(0)
      }
    })
  })
})

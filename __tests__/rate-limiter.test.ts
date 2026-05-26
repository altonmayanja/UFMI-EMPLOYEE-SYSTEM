/**
 * Tests for the Rate Limiter
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Rate limiter uses in-memory store. We can't easily clear it between tests,
    // but we use unique identifiers to avoid collisions.
  })

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-user-1', 'employee_generate')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 max - 1 used
    })

    it('should deny after max requests', () => {
      const userId = `rate-limit-max-${Date.now()}`
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(userId, 'employee_generate')
        expect(result.allowed).toBe(true)
      }
      // 6th should be denied
      const result = checkRateLimit(userId, 'employee_generate')
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different users independently', () => {
      const user1 = `independent-1-${Date.now()}`
      const user2 = `independent-2-${Date.now()}`

      // Exhaust user1's limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(user1, 'employee_generate')
      }
      expect(checkRateLimit(user1, 'employee_generate').allowed).toBe(false)
      
      // User2 should still be allowed
      expect(checkRateLimit(user2, 'employee_generate').allowed).toBe(true)
    })

    it('should track different rate limit types independently', () => {
      const userId = `multi-type-${Date.now()}`

      // Exhaust employee_generate
      for (let i = 0; i < 5; i++) {
        checkRateLimit(userId, 'employee_generate')
      }
      expect(checkRateLimit(userId, 'employee_generate').allowed).toBe(false)

      // admin_generate should still work (different limit)
      expect(checkRateLimit(userId, 'admin_generate').allowed).toBe(true)
    })

    it('should return valid resetAt timestamp', () => {
      const result = checkRateLimit('reset-test', 'employee_generate')
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })
  })

  describe('getRateLimitErrorMessage', () => {
    it('should return error message with correct limits', () => {
      const msg = getRateLimitErrorMessage('employee_generate')
      expect(msg).toContain('5')
      expect(msg).toContain('60')
    })

    it('should return error message for admin', () => {
      const msg = getRateLimitErrorMessage('admin_generate')
      expect(msg).toContain('20')
    })

    it('should return error message for bulk', () => {
      const msg = getRateLimitErrorMessage('admin_bulk')
      expect(msg).toContain('3')
    })
  })
})

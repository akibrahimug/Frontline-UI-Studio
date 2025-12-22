import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter } from "../rate-limit";

/**
 * Unit tests for rate limiting functionality
 * Tests sliding window algorithm and various rate limit scenarios
 */

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 10000, // 10 seconds for testing
      identifier: "test",
    });
  });

  afterEach(() => {
    // Reset the rate limiter store between tests
    rateLimiter.reset("test-user");
  });

  describe("Basic Rate Limiting", () => {
    it("should allow requests within limit", () => {
      const result1 = rateLimiter.check("test-user");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = rateLimiter.check("test-user");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);

      const result3 = rateLimiter.check("test-user");
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(2);
    });

    it("should block requests exceeding limit", () => {
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.check("test-user");
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = rateLimiter.check("test-user");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should track different users separately", () => {
      rateLimiter.check("user1");
      rateLimiter.check("user1");

      const result1 = rateLimiter.check("user1");
      expect(result1.remaining).toBe(2);

      const result2 = rateLimiter.check("user2");
      expect(result2.remaining).toBe(4); // Different user, fresh limit
    });

    it("should return correct remaining count", () => {
      const result1 = rateLimiter.check("test-user");
      expect(result1.remaining).toBe(4);

      const result2 = rateLimiter.check("test-user");
      expect(result2.remaining).toBe(3);

      const result3 = rateLimiter.check("test-user");
      expect(result3.remaining).toBe(2);
    });

    it("should include retryAfter when rate limited", () => {
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check("test-user");
      }

      const result = rateLimiter.check("test-user");
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(10); // Within window
    });
  });

  describe("Sliding Window", () => {
    it("should allow requests after window expires", async () => {
      const quickLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100, // 100ms window
        identifier: "quick",
      });

      // Use up limit
      quickLimiter.check("test-user");
      quickLimiter.check("test-user");

      // Next request should be blocked
      const blockedResult = quickLimiter.check("test-user");
      expect(blockedResult.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      const allowedResult = quickLimiter.check("test-user");
      expect(allowedResult.allowed).toBe(true);

      quickLimiter.reset("test-user");
    });

    it("should properly calculate reset time", () => {
      const now = Date.now();
      const result = rateLimiter.check("test-user");

      expect(result.reset).toBeGreaterThan(now);
      expect(result.reset).toBeLessThanOrEqual(now + 10000 + 100); // Allow small margin
    });
  });

  describe("Edge Cases", () => {
    it("should handle exactly at limit", () => {
      // Use exactly 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.check("test-user");
        expect(result.allowed).toBe(true);
      }

      // 6th should be blocked
      const result = rateLimiter.check("test-user");
      expect(result.allowed).toBe(false);
    });

    it("should handle zero remaining correctly", () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.check("test-user");
      }

      const result = rateLimiter.check("test-user");
      expect(result.remaining).toBe(0);
    });

    it("should handle rapid consecutive requests", () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.check("test-user"));
      }

      const allowed = results.filter(r => r.allowed);
      const blocked = results.filter(r => !r.allowed);

      expect(allowed.length).toBe(5);
      expect(blocked.length).toBe(5);
    });

    it("should handle empty user identifier", () => {
      const result = rateLimiter.check("");
      expect(result.allowed).toBe(true);
    });

    it("should handle very long user identifier", () => {
      const longId = "a".repeat(1000);
      const result = rateLimiter.check(longId);
      expect(result.allowed).toBe(true);
    });
  });

  describe("Different Configurations", () => {
    it("should respect different max request limits", () => {
      const limiter1 = new RateLimiter({
        maxRequests: 3,
        windowMs: 10000,
        identifier: "limiter1",
      });

      for (let i = 0; i < 3; i++) {
        const result = limiter1.check("user");
        expect(result.allowed).toBe(true);
      }

      const result = limiter1.check("user");
      expect(result.allowed).toBe(false);

      limiter1.reset("user");
    });

    it("should handle very small window sizes", () => {
      const quickLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 10, // 10ms
        identifier: "quick2",
      });

      quickLimiter.check("user");
      quickLimiter.check("user");

      const result = quickLimiter.check("user");
      expect(result.allowed).toBe(false);

      quickLimiter.reset("user");
    });

    it("should handle very large window sizes", () => {
      const slowLimiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 3600000, // 1 hour
        identifier: "slow",
      });

      const result = slowLimiter.check("user");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);

      slowLimiter.reset("user");
    });
  });

  describe("RateLimiter Methods", () => {
    describe("reset", () => {
      it("should reset rate limit for a user", () => {
        // Use up limit
        for (let i = 0; i < 5; i++) {
          rateLimiter.check("test-user");
        }

        // Should be blocked
        const blocked = rateLimiter.check("test-user");
        expect(blocked.allowed).toBe(false);

        // Reset
        rateLimiter.reset("test-user");

        // Should be allowed again
        const allowed = rateLimiter.check("test-user");
        expect(allowed.allowed).toBe(true);
        expect(allowed.remaining).toBe(4);
      });

      it("should only reset specific user", () => {
        rateLimiter.check("user1");
        rateLimiter.check("user1");
        rateLimiter.check("user2");

        rateLimiter.reset("user1");

        const result1 = rateLimiter.check("user1");
        expect(result1.remaining).toBe(4); // Reset

        const result2 = rateLimiter.check("user2");
        expect(result2.remaining).toBe(2); // Not reset (already had 1 request, now 2 total)
      });
    });

    describe("getStatus", () => {
      it("should return current status without incrementing", () => {
        rateLimiter.check("test-user");
        rateLimiter.check("test-user");

        const status = rateLimiter.getStatus("test-user");
        expect(status.currentRequests).toBe(2);
        expect(status.remaining).toBe(3);

        // Check again - should be same
        const status2 = rateLimiter.getStatus("test-user");
        expect(status2.currentRequests).toBe(2);
        expect(status2.remaining).toBe(3);
      });

      it("should return zero requests for new user", () => {
        const status = rateLimiter.getStatus("new-user");
        expect(status.currentRequests).toBe(0);
        expect(status.remaining).toBe(5);
      });
    });

    describe("increment", () => {
      it("should increment request count", () => {
        rateLimiter.increment("test-user");

        const status = rateLimiter.getStatus("test-user");
        expect(status.currentRequests).toBe(1);
      });
    });
  });

  describe("Concurrent Scenarios", () => {
    it("should handle concurrent requests from same user", () => {
      const results: any[] = [];

      // Simulate 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.check("test-user"));
      }

      const allowed = results.filter(r => r.allowed);
      expect(allowed.length).toBe(5);
    });

    it("should handle concurrent requests from multiple users", () => {
      // Create fresh rate limiter for this test to avoid interference
      const freshLimiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 10000,
        identifier: "concurrent-test",
      });

      const users = ["user1", "user2", "user3"];
      const results: any[] = [];

      users.forEach(user => {
        for (let i = 0; i < 3; i++) {
          results.push(freshLimiter.check(user));
        }
      });

      // All should be allowed (3 requests per user, limit is 5)
      const allowed = results.filter(r => r.allowed);
      expect(allowed.length).toBe(9);

      // Clean up
      users.forEach(user => freshLimiter.reset(user));
    });
  });

  describe("Identifier Isolation", () => {
    it("should isolate different identifiers", () => {
      const limiter1 = new RateLimiter({
        maxRequests: 5,
        windowMs: 10000,
        identifier: "api",
      });

      const limiter2 = new RateLimiter({
        maxRequests: 5,
        windowMs: 10000,
        identifier: "auth",
      });

      // Use up limiter1
      for (let i = 0; i < 5; i++) {
        limiter1.check("test-user");
      }

      const blocked = limiter1.check("test-user");
      expect(blocked.allowed).toBe(false);

      // limiter2 should still allow
      const allowed = limiter2.check("test-user");
      expect(allowed.allowed).toBe(true);

      limiter1.reset("test-user");
      limiter2.reset("test-user");
    });
  });

  describe("Performance", () => {
    it("should handle large number of requests efficiently", () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        rateLimiter.check(`user-${i % 100}`);
      }

      const duration = Date.now() - start;

      // Should complete in reasonable time (< 100ms for 1000 requests)
      expect(duration).toBeLessThan(100);
    });
  });
});

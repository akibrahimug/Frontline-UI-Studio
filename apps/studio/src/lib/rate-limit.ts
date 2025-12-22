/**
 * Rate Limiting Utility
 * Implements sliding window rate limiting for API endpoints
 */

type RateLimitConfig = {
  /**
   * Number of requests allowed within the window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Unique identifier for this rate limiter
   */
  identifier?: string;
};

type RequestRecord = {
  timestamp: number;
  count: number;
};

/**
 * In-memory store for rate limit records
 * In production, use Redis or similar distributed cache
 */
const rateLimitStore = new Map<string, RequestRecord[]>();

/**
 * Clean up old entries from the store periodically
 */
function cleanupStore() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [key, records] of rateLimitStore.entries()) {
    const validRecords = records.filter(record => record.timestamp > oneHourAgo);

    if (validRecords.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRecords);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupStore, 5 * 60 * 1000);
}

/**
 * Rate limiter class using sliding window algorithm
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private identifier: string;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.identifier = config.identifier || "default";
  }

  /**
   * Check if a request should be rate limited
   * @param key Unique identifier for the requester (e.g., userId, IP address)
   * @returns Object with allowed status and retry-after time
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    reset: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const storeKey = `${this.identifier}:${key}`;

    // Get existing records for this key
    const records = rateLimitStore.get(storeKey) || [];

    // Remove expired records (outside the window)
    const windowStart = now - this.windowMs;
    const validRecords = records.filter(record => record.timestamp > windowStart);

    // Calculate total requests in the current window
    const totalRequests = validRecords.reduce((sum, record) => sum + record.count, 0);

    // Check if limit exceeded
    if (totalRequests >= this.maxRequests) {
      // Find the oldest record to calculate when the window resets
      const oldestRecord = validRecords[0];
      const resetTime = oldestRecord ? oldestRecord.timestamp + this.windowMs : now + this.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000); // in seconds

      return {
        allowed: false,
        remaining: 0,
        reset: resetTime,
        retryAfter,
      };
    }

    // Add new record
    validRecords.push({
      timestamp: now,
      count: 1,
    });

    rateLimitStore.set(storeKey, validRecords);

    const remaining = this.maxRequests - (totalRequests + 1);
    const resetTime = now + this.windowMs;

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      reset: resetTime,
    };
  }

  /**
   * Increment the request count for a key
   * Useful when you want to manually track requests
   */
  increment(key: string): void {
    this.check(key);
  }

  /**
   * Reset rate limit for a specific key
   * Useful for testing or manual intervention
   */
  reset(key: string): void {
    const storeKey = `${this.identifier}:${key}`;
    rateLimitStore.delete(storeKey);
  }

  /**
   * Get current status for a key without incrementing
   */
  getStatus(key: string): {
    currentRequests: number;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    const storeKey = `${this.identifier}:${key}`;

    const records = rateLimitStore.get(storeKey) || [];
    const windowStart = now - this.windowMs;
    const validRecords = records.filter(record => record.timestamp > windowStart);
    const totalRequests = validRecords.reduce((sum, record) => sum + record.count, 0);

    const remaining = Math.max(0, this.maxRequests - totalRequests);
    const resetTime = validRecords[0]
      ? validRecords[0].timestamp + this.windowMs
      : now + this.windowMs;

    return {
      currentRequests: totalRequests,
      remaining,
      reset: resetTime,
    };
  }
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per minute
   */
  auth: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
    identifier: "auth",
  }),

  /**
   * Moderate rate limit for Pusher endpoints
   * 60 requests per minute (1 per second)
   */
  pusher: new RateLimiter({
    maxRequests: 60,
    windowMs: 60 * 1000,
    identifier: "pusher",
  }),

  /**
   * Lenient rate limit for general API endpoints
   * 100 requests per minute
   */
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000,
    identifier: "api",
  }),

  /**
   * Very strict rate limit for expensive operations
   * 10 requests per minute
   */
  expensive: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
    identifier: "expensive",
  }),
};

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer userId if authenticated
  if (userId) {
    return userId;
  }

  // Fall back to IP address
  // Check various headers for the real IP (behind proxies/CDNs)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip = cfConnectingIp || realIp || forwarded?.split(",")[0] || "unknown";

  return ip;
}

/**
 * Middleware helper for Next.js API routes
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  getIdentifier: (request: Request) => string | Promise<string>
) {
  return async (request: Request): Promise<Response | null> => {
    const identifier = await getIdentifier(request);
    const result = rateLimiter.check(identifier);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfter),
            "X-RateLimit-Limit": String(rateLimiter["maxRequests"]),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      );
    }

    // Allow the request to proceed
    // The calling function should add rate limit headers to response
    return null;
  };
}

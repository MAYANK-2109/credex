import { NextResponse } from 'next/server';

interface RateLimitTracker {
  timestamps: number[];
}

const trackers = new Map<string, RateLimitTracker>();

// Clean up trackers once every 10 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  trackers.forEach((tracker, ip) => {
    tracker.timestamps = tracker.timestamps.filter((t: number) => now - t < 60000);
    if (tracker.timestamps.length === 0) {
      trackers.delete(ip);
    }
  });
}, 600000).unref?.();

/**
 * Slide-window rate limiting.
 * @param ip Client IP address to rate limit.
 * @param limit Max number of requests allowed in the window.
 * @param windowMs Time window in milliseconds (default 60000).
 * @returns boolean - true if allowed, false if rate limited.
 */
export function isAllowed(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  let tracker = trackers.get(ip);

  if (!tracker) {
    tracker = { timestamps: [] };
    trackers.set(ip, tracker);
  }

  // Filter timestamps within the sliding window
  tracker.timestamps = tracker.timestamps.filter((t: number) => now - t < windowMs);

  if (tracker.timestamps.length >= limit) {
    return false;
  }

  tracker.timestamps.push(now);
  return true;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}

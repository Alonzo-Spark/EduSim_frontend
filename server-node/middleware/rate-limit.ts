import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./error.js";

interface RateLimitState {
  hits: number;
  windowStartMs: number;
}

const state = new Map<string, RateLimitState>();

export function createInMemoryRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options;

  return function rateLimiter(request: Request, _response: Response, next: NextFunction): void {
    const now = Date.now();
    const key = request.ip || "unknown-ip";
    const current = state.get(key);

    if (!current || now - current.windowStartMs >= windowMs) {
      state.set(key, { hits: 1, windowStartMs: now });
      next();
      return;
    }

    if (current.hits >= maxRequests) {
      next(new HttpError("Rate limit exceeded. Please try again shortly.", 429));
      return;
    }

    current.hits += 1;
    state.set(key, current);
    next();
  };
}

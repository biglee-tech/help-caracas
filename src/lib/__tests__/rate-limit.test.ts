import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("permite solicitudes dentro del limite y reporta remaining decreciente", () => {
    const key = "test-allow";
    const opts = { now: 1_000, windowMs: 60_000, maxRequests: 3 };

    expect(checkRateLimit(key, opts)).toMatchObject({ allowed: true, limit: 3, remaining: 2 });
    expect(checkRateLimit(key, opts)).toMatchObject({ allowed: true, limit: 3, remaining: 1 });
    expect(checkRateLimit(key, opts)).toMatchObject({ allowed: true, limit: 3, remaining: 0 });
  });

  it("bloquea al superar el limite dentro de la ventana", () => {
    const key = "test-block";
    const opts = { now: 1_000, windowMs: 60_000, maxRequests: 2 };

    checkRateLimit(key, opts);
    checkRateLimit(key, opts);
    const result = checkRateLimit(key, opts);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.resetSeconds).toBe(result.retryAfterSeconds);
  });

  it("reinicia el contador al pasar la ventana", () => {
    const key = "test-window-reset";
    const opts = { windowMs: 60_000, maxRequests: 1 };

    expect(checkRateLimit(key, { ...opts, now: 0 }).allowed).toBe(true);
    expect(checkRateLimit(key, { ...opts, now: 1_000 }).allowed).toBe(false);
    expect(checkRateLimit(key, { ...opts, now: 60_001 }).allowed).toBe(true);
  });

  it("trata claves distintas de forma independiente", () => {
    const opts = { now: 1_000, windowMs: 60_000, maxRequests: 1 };

    expect(checkRateLimit("ip-a", opts).allowed).toBe(true);
    expect(checkRateLimit("ip-b", opts).allowed).toBe(true);
    expect(checkRateLimit("ip-a", opts).allowed).toBe(false);
  });
});

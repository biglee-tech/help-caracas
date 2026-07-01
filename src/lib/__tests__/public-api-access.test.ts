import { describe, expect, it } from "vitest";

import { rateLimitHeaders } from "@/lib/public-api-access";

describe("rateLimitHeaders", () => {
  it("expone limit, remaining y reset como headers de texto", () => {
    expect(
      rateLimitHeaders({
        allowed: true,
        limit: 30,
        remaining: 12,
        retryAfterSeconds: 0,
        resetSeconds: 45,
      }),
    ).toEqual({
      "X-RateLimit-Limit": "30",
      "X-RateLimit-Remaining": "12",
      "X-RateLimit-Reset": "45",
    });
  });
});

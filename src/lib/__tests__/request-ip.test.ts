import { describe, expect, it } from "vitest";

import { getClientIp } from "@/lib/request-ip";

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/v1/personas", { headers });
}

describe("getClientIp", () => {
  it("usa la primera IP de x-forwarded-for", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178",
    });

    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("recurre a x-real-ip si no hay x-forwarded-for", () => {
    const request = requestWithHeaders({ "x-real-ip": "203.0.113.9" });

    expect(getClientIp(request)).toBe("203.0.113.9");
  });

  it("devuelve 'unknown' si no hay headers de IP", () => {
    const request = requestWithHeaders({});

    expect(getClientIp(request)).toBe("unknown");
  });
});

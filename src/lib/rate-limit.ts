/**
 * Limitador de tasa en memoria, por clave (ej. IP), ventana fija.
 *
 * Limitación conocida: el estado vive en el proceso de Node. En un
 * despliegue serverless con varias instancias (Vercel, etc.) cada una
 * lleva su propio conteo, así que el límite real efectivo es
 * `maxRequests * numero_de_instancias`. Para un límite estricto y
 * compartido entre instancias se necesita un backend externo (Upstash
 * Redis, Vercel Firewall). Esto es una primera barrera razonable sin
 * agregar infraestructura nueva.
 */

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 30;
const MAX_TRACKED_KEYS = 10_000;

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetSeconds: number;
};

export type RateLimitOptions = {
  now?: number;
  windowMs?: number;
  maxRequests?: number;
};

function pruneExpired(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= windowMs) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const now = options.now ?? Date.now();
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;

  if (buckets.size > MAX_TRACKED_KEYS) {
    pruneExpired(now, windowMs);
  }

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const resetSeconds = Math.max(
    1,
    Math.ceil((bucket.windowStart + windowMs - now) / 1000),
  );

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      retryAfterSeconds: resetSeconds,
      resetSeconds,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - bucket.count,
    retryAfterSeconds: 0,
    resetSeconds,
  };
}

/** Solo para tests: limpia todo el estado del limitador. */
export function resetRateLimitStateForTests() {
  buckets.clear();
}

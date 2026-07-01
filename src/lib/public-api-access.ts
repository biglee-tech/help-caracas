import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * Presupuesto compartido entre todas las rutas de /api/v1/*: si cada
 * ruta tuviera su propio contador, alguien podria esquivar el limite
 * llamando a varios endpoints en paralelo.
 */
export function checkPublicApiRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`public-api:${ip}`, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
  });
}

/**
 * Headers estandar de rate limit (estilo IETF draft / GitHub API) para
 * que un integrador pueda autorregularse antes de chocar contra el
 * limite, en vez de enterarse recien al recibir un 429.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSeconds),
  };
}

export function logPublicApiAccess(entry: {
  event: string;
  ip: string;
  status: number;
  rateLimited: boolean;
  resultCount?: number;
}) {
  // No se registra el contenido de la búsqueda (q, cedula, etc.): es
  // metadata sensible en sí misma ("quien busco a quien"). Solo se
  // registra lo necesario para detectar abuso (IP, estado, conteo).
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    }),
  );
}

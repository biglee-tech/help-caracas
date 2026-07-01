/**
 * Extrae la IP del cliente desde los headers de proxy estándar.
 * No hay forma de verificar criptográficamente estos headers, así que
 * esto es identificación best-effort (suficiente para rate limiting,
 * no para autenticación ni para bloqueo de acceso).
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export const CARACAS_TIME_ZONE = "America/Caracas";

/**
 * Los timestamps de ingreso en Supabase guardan la hora de Caracas
 * con offset +00 (hora local en el campo UTC). Formatear en UTC
 * para mostrar la hora correcta sin desfase de 4 horas.
 */
export function parseTimestamp(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) {
    return new Date(`${value}Z`);
  }

  return new Date(value);
}

export function formatAdmissionDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  const date = typeof value === "string" ? parseTimestamp(value) : value;

  return new Intl.DateTimeFormat("es-VE", {
    ...options,
    timeZone: "UTC",
  }).format(date);
}


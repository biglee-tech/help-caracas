import type { EmergencyAdmission, Hospital } from "@/lib/types";

export const ADMISSION_SELECT =
  "id,nombres,apellidos,cedula,edad,sexo,procedencia,hospital_id,fecha_ingreso,servicio_requerido,estado,created_at,hospitales(id,nombre,ciudad)" as const;

export function normalizeAdmissionRow(item: unknown): EmergencyAdmission {
  const admission = item as EmergencyAdmission & {
    hospitales?: Hospital | Hospital[] | null;
  };
  const hospital = Array.isArray(admission.hospitales)
    ? admission.hospitales[0]
    : admission.hospitales;

  return { ...admission, hospitales: hospital ?? null };
}

export function normalizeAdmissionRows(data: unknown): EmergencyAdmission[] {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAdmissionRow);
}

export function normalizeSearchTerm(value?: string | null): string {
  return value?.trim().replace(/[%,()]/g, "").slice(0, 80) ?? "";
}

export function buildSearchOrClause(searchTerm: string): string {
  const clauses = [
    `nombres.ilike.%${searchTerm}%`,
    `apellidos.ilike.%${searchTerm}%`,
    `cedula.ilike.%${searchTerm}%`,
    `procedencia.ilike.%${searchTerm}%`,
    `servicio_requerido.ilike.%${searchTerm}%`,
  ];

  const words = searchTerm.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    clauses.push(`and(nombres.ilike.%${words[0]}%,apellidos.ilike.%${words[1]}%)`);
    clauses.push(`and(nombres.ilike.%${words[1]}%,apellidos.ilike.%${words[0]}%)`);
  }

  return clauses.join(",");
}

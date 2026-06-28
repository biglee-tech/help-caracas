import { formatDisplayName } from "@/lib/person-normalize";
import type { EmergencyAdmission } from "@/lib/types";
import type { AdmissionInput } from "@/lib/validation";
import { admissionStatuses } from "@/lib/validation";

const STATUS_ORDER = admissionStatuses;

export type FillEmptyFieldsResult = {
  updates: Partial<
    Pick<
      EmergencyAdmission,
      | "cedula"
      | "edad"
      | "sexo"
      | "procedencia"
      | "servicio_requerido"
      | "estado"
    >
  >;
  filledFields: string[];
};

export function recordAllowsPublicUpdate(existing: EmergencyAdmission): boolean {
  return (
    existing.cedula === null ||
    isBlank(existing.cedula) ||
    existing.edad === null ||
    isBlank(existing.procedencia)
  );
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

function isUnspecifiedSexo(value: string | null | undefined): boolean {
  return isBlank(value) || value === "No especificado";
}

function isEmptyServicio(value: string | null | undefined): boolean {
  if (isBlank(value)) {
    return true;
  }

  const normalized = value as string;
  return normalized.trim().toLowerCase() === "sin especificar";
}

function pickBestStatus(current: string | null | undefined, incoming: string): string {
  const currentIndex = STATUS_ORDER.indexOf(
    (current ?? "Pendiente") as (typeof STATUS_ORDER)[number],
  );
  const incomingIndex = STATUS_ORDER.indexOf(
    incoming as (typeof STATUS_ORDER)[number],
  );

  if (currentIndex === -1) {
    return incoming;
  }

  if (incomingIndex === -1) {
    return current ?? "Pendiente";
  }

  return incomingIndex > currentIndex ? incoming : (current ?? "Pendiente");
}

export function buildFillEmptyUpdates(
  existing: EmergencyAdmission,
  incoming: AdmissionInput,
): FillEmptyFieldsResult {
  const updates: FillEmptyFieldsResult["updates"] = {};
  const filledFields: string[] = [];

  if (isBlank(existing.cedula) && incoming.cedula) {
    updates.cedula = incoming.cedula;
    filledFields.push("cedula");
  }

  if (existing.edad === null && incoming.edad !== undefined) {
    updates.edad = incoming.edad ?? null;
    filledFields.push("edad");
  }

  if (isUnspecifiedSexo(existing.sexo) && !isUnspecifiedSexo(incoming.sexo)) {
    updates.sexo = incoming.sexo;
    filledFields.push("sexo");
  }

  if (isBlank(existing.procedencia) && incoming.procedencia) {
    updates.procedencia = incoming.procedencia;
    filledFields.push("procedencia");
  }

  if (
    isEmptyServicio(existing.servicio_requerido) &&
    !isEmptyServicio(incoming.servicio_requerido)
  ) {
    updates.servicio_requerido = incoming.servicio_requerido;
    filledFields.push("servicio_requerido");
  }

  const bestStatus = pickBestStatus(existing.estado, incoming.estado ?? "Pendiente");
  if (bestStatus !== (existing.estado ?? "Pendiente")) {
    updates.estado = bestStatus;
    filledFields.push("estado");
  }

  return { updates, filledFields };
}

export function normalizeAdmissionNames(input: AdmissionInput): {
  nombres: string;
  apellidos: string;
} {
  return {
    nombres: formatDisplayName(input.nombres),
    apellidos: formatDisplayName(input.apellidos),
  };
}

export function formatFilledFieldsSummary(filledFields: string[]): string {
  const labels: Record<string, string> = {
    cedula: "cedula",
    edad: "edad",
    sexo: "sexo",
    procedencia: "procedencia",
    servicio_requerido: "servicio",
    estado: "estado",
  };

  return filledFields.map((field) => labels[field] ?? field).join(", ");
}

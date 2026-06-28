import type { SupabaseClient } from "@supabase/supabase-js";

import { ADMISSION_SELECT, normalizeAdmissionRows } from "@/lib/admissions-query";
import { rankSimilarMatches } from "@/lib/person-match";
import { tokenizeName } from "@/lib/person-normalize";
import type {
  EmergencyAdmission,
  SimilarityInput,
  SimilarMatch,
  SimilarMatchSummary,
} from "@/lib/types";

const DEFAULT_SEARCH_HOURS = 168;
const MAX_CANDIDATES = 50;
const MAX_RESULTS = 5;

export function getSimilarSearchHours(): number {
  const configured = Number(process.env.SIMILAR_SEARCH_HOURS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_SEARCH_HOURS;
}

function buildSearchFilters(input: SimilarityInput): string[] {
  const tokens = tokenizeName(input.nombres, input.apellidos).slice(0, 4);

  if (tokens.length === 0) {
    return [];
  }

  return tokens.flatMap((token) => [
    `nombres.ilike.%${token}%`,
    `apellidos.ilike.%${token}%`,
  ]);
}

export async function findSimilarAdmissions(
  supabase: SupabaseClient,
  input: SimilarityInput,
  options?: { limit?: number; hours?: number },
): Promise<SimilarMatch[]> {
  const hours = options?.hours ?? getSimilarSearchHours();
  const limit = options?.limit ?? MAX_RESULTS;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const searchFilters = buildSearchFilters(input);

  if (searchFilters.length === 0) {
    return [];
  }

  const query = supabase
    .from("ingresos_emergencia")
    .select(ADMISSION_SELECT)
    .gte("fecha_ingreso", since)
    .order("fecha_ingreso", { ascending: false })
    .limit(MAX_CANDIDATES)
    .or(searchFilters.join(","));

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return rankSimilarMatches(input, normalizeAdmissionRows(data)).slice(0, limit);
}

export function toSimilarMatchSummary(match: SimilarMatch): SimilarMatchSummary {
  const { admission, score, reasons } = match;

  return {
    id: admission.id,
    nombres: admission.nombres,
    apellidos: admission.apellidos,
    cedula: admission.cedula,
    edad: admission.edad,
    sexo: admission.sexo,
    procedencia: admission.procedencia,
    hospital_nombre: admission.hospitales?.nombre ?? null,
    hospital_ciudad: admission.hospitales?.ciudad ?? null,
    fecha_ingreso: admission.fecha_ingreso,
    estado: admission.estado,
    servicio_requerido: admission.servicio_requerido,
    score,
    reasons,
  };
}

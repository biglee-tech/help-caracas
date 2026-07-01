import { formatCedulaForDisplay } from "@/lib/person-normalize";
import type { EmergencyAdmission } from "@/lib/types";

export const PUBLIC_API_DEFAULT_PAGE_SIZE = 20;
export const PUBLIC_API_MAX_PAGE_SIZE = 50;

export type PublicAdmission = {
  nombres: string;
  apellidos: string;
  cedula: string | null;
  edad: number | null;
  sexo: string;
  procedencia: string | null;
  hospital: { nombre: string; ciudad: string | null } | null;
  fecha_ingreso: string;
  estado: string | null;
};

/**
 * Whitelist de columnas/orden ordenables. Nunca se debe pasar un valor
 * de query string directo a `.order()` de Supabase: aunque PostgREST
 * valida nombres de columna, restringir a un set conocido evita
 * exponer accidentalmente columnas nuevas como "ordenables" en el
 * futuro y deja el contrato de la API explícito.
 */
export const PUBLIC_API_SORT_OPTIONS = {
  recientes: [
    { column: "fecha_ingreso", ascending: false },
    { column: "id", ascending: false },
  ],
  antiguos: [
    { column: "fecha_ingreso", ascending: true },
    { column: "id", ascending: true },
  ],
  nombre_asc: [
    { column: "nombres", ascending: true },
    { column: "id", ascending: true },
  ],
  nombre_desc: [
    { column: "nombres", ascending: false },
    { column: "id", ascending: true },
  ],
} as const satisfies Record<string, { column: string; ascending: boolean }[]>;

export type PublicApiSort = keyof typeof PUBLIC_API_SORT_OPTIONS;

export const PUBLIC_API_DEFAULT_SORT: PublicApiSort = "recientes";

export function parsePublicApiSort(value: string | null): PublicApiSort {
  if (value && value in PUBLIC_API_SORT_OPTIONS) {
    return value as PublicApiSort;
  }

  return PUBLIC_API_DEFAULT_SORT;
}

export function parsePublicApiPagination(params: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawPageSize = Number(params.get("page_size"));
  const pageSize =
    Number.isInteger(rawPageSize) && rawPageSize > 0
      ? Math.min(rawPageSize, PUBLIC_API_MAX_PAGE_SIZE)
      : PUBLIC_API_DEFAULT_PAGE_SIZE;

  return { page, pageSize };
}

export function toPublicAdmission(admission: EmergencyAdmission): PublicAdmission {
  return {
    nombres: admission.nombres,
    apellidos: admission.apellidos,
    cedula: formatCedulaForDisplay(admission.cedula),
    edad: admission.edad,
    sexo: admission.sexo,
    procedencia: admission.procedencia,
    hospital: admission.hospitales
      ? { nombre: admission.hospitales.nombre, ciudad: admission.hospitales.ciudad }
      : null,
    fecha_ingreso: admission.fecha_ingreso,
    estado: admission.estado,
  };
}

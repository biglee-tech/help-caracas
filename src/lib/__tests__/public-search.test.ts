import { describe, expect, it } from "vitest";

import {
  PUBLIC_API_DEFAULT_PAGE_SIZE,
  PUBLIC_API_DEFAULT_SORT,
  PUBLIC_API_MAX_PAGE_SIZE,
  parsePublicApiPagination,
  parsePublicApiSort,
  toPublicAdmission,
} from "@/lib/public-search";

describe("parsePublicApiSort", () => {
  it("acepta valores conocidos", () => {
    expect(parsePublicApiSort("nombre_asc")).toBe("nombre_asc");
    expect(parsePublicApiSort("antiguos")).toBe("antiguos");
  });

  it("usa el valor por defecto si no se reconoce o falta", () => {
    expect(parsePublicApiSort(null)).toBe(PUBLIC_API_DEFAULT_SORT);
    expect(parsePublicApiSort("algo_invalido")).toBe(PUBLIC_API_DEFAULT_SORT);
  });
});

describe("parsePublicApiPagination", () => {
  it("usa valores por defecto sin parametros", () => {
    expect(parsePublicApiPagination(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: PUBLIC_API_DEFAULT_PAGE_SIZE,
    });
  });

  it("respeta page y page_size validos", () => {
    expect(
      parsePublicApiPagination(new URLSearchParams("page=3&page_size=10")),
    ).toEqual({ page: 3, pageSize: 10 });
  });

  it("limita page_size al maximo permitido", () => {
    expect(
      parsePublicApiPagination(new URLSearchParams("page_size=999")),
    ).toEqual({ page: 1, pageSize: PUBLIC_API_MAX_PAGE_SIZE });
  });

  it("ignora valores invalidos y usa los por defecto", () => {
    expect(
      parsePublicApiPagination(new URLSearchParams("page=-1&page_size=abc")),
    ).toEqual({ page: 1, pageSize: PUBLIC_API_DEFAULT_PAGE_SIZE });
  });
});

describe("toPublicAdmission", () => {
  it("conserva la cedula y el resto de campos", () => {
    const result = toPublicAdmission({
      nombres: "Ana",
      apellidos: "Perez",
      cedula: "V-12345678",
      edad: 30,
      sexo: "Femenino",
      procedencia: "Petare",
      hospital_id: 2,
      fecha_ingreso: "2026-06-24T10:00:00Z",
      servicio_requerido: "Trauma",
      estado: "Pendiente",
      created_at: "2026-06-24T10:00:00Z",
      hospitales: { nombre: "Hospital Central", ciudad: "Caracas" },
    } as Parameters<typeof toPublicAdmission>[0]);

    expect(result).toEqual({
      nombres: "Ana",
      apellidos: "Perez",
      cedula: "V-12345678",
      edad: 30,
      sexo: "Femenino",
      procedencia: "Petare",
      hospital: { nombre: "Hospital Central", ciudad: "Caracas" },
      fecha_ingreso: "2026-06-24T10:00:00Z",
      estado: "Pendiente",
    });
  });

  it("devuelve hospital null si no hay hospital asociado", () => {
    const result = toPublicAdmission({
      nombres: "Luis",
      apellidos: "Gomez",
      cedula: null,
      edad: null,
      sexo: "Masculino",
      procedencia: null,
      hospital_id: 0,
      fecha_ingreso: "2026-06-24T10:00:00Z",
      servicio_requerido: "Sin especificar",
      estado: null,
      created_at: "2026-06-24T10:00:00Z",
      hospitales: null,
    } as Parameters<typeof toPublicAdmission>[0]);

    expect(result.hospital).toBeNull();
    expect(result.cedula).toBeNull();
  });
});

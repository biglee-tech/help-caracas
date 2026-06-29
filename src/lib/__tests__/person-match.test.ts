import { describe, expect, it } from "vitest";

import { rankSimilarMatches, scoreSimilarity } from "@/lib/person-match";
import type { EmergencyAdmission, SimilarityInput } from "@/lib/types";

function makeAdmission(overrides: Partial<EmergencyAdmission> = {}): EmergencyAdmission {
  return {
    id: 1,
    nombres: "Maria",
    apellidos: "Perez",
    cedula: null,
    edad: null,
    sexo: "No especificado",
    procedencia: null,
    hospital_id: 1,
    fecha_ingreso: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // hace 1 hora
    servicio_requerido: "Traumatologia",
    estado: "Pendiente",
    created_at: new Date().toISOString(),
    hospitales: null,
    ...overrides,
  };
}

function makeInput(overrides: Partial<SimilarityInput> = {}): SimilarityInput {
  return {
    nombres: "Maria",
    apellidos: "Perez",
    cedula: null,
    edad: null,
    sexo: "No especificado",
    hospital_id: 1,
    ...overrides,
  };
}

describe("scoreSimilarity — cédula", () => {
  it("retorna null si las cédulas son distintas", () => {
    const input = makeInput({ cedula: "12345678" });
    const candidate = makeAdmission({ cedula: "V-99999999" });
    expect(scoreSimilarity(input, candidate)).toBeNull();
  });

  it("suma puntos altos por cédula idéntica", () => {
    const input = makeInput({ cedula: "V-12.345.678" });
    const candidate = makeAdmission({ cedula: "12345678" });
    const match = scoreSimilarity(input, candidate);
    expect(match).not.toBeNull();
    expect(match!.reasons).toContain("Misma cedula");
    expect(match!.score).toBeGreaterThanOrEqual(100);
  });
});

describe("scoreSimilarity — nombre", () => {
  it("detecta dos tokens en común", () => {
    const input = makeInput({ nombres: "Maria Jose", apellidos: "Perez Garcia" });
    const candidate = makeAdmission({ nombres: "Maria Jose", apellidos: "Perez Rodriguez" });
    const match = scoreSimilarity(input, candidate);
    expect(match).not.toBeNull();
    expect(match!.reasons.some((r) => r.includes("nombres en comun"))).toBe(true);
  });

  it("detecta nombre muy parecido con acentos distintos", () => {
    const input = makeInput({ nombres: "María", apellidos: "Pérez" });
    const candidate = makeAdmission({ nombres: "Maria", apellidos: "Perez" });
    const match = scoreSimilarity(input, candidate);
    expect(match).not.toBeNull();
  });

  it("detecta nombre invertido (apellido-nombre)", () => {
    const input = makeInput({ nombres: "Ana", apellidos: "Rodriguez" });
    const candidate = makeAdmission({ nombres: "Rodriguez", apellidos: "Ana" });
    const match = scoreSimilarity(input, candidate);
    expect(match).not.toBeNull();
  });
});

describe("scoreSimilarity — edad y sexo", () => {
  it("suma puntos por misma edad", () => {
    const input = makeInput({ edad: 35 });
    const candidate = makeAdmission({ edad: 35 });
    const match = scoreSimilarity(input, candidate);
    expect(match!.reasons).toContain("Misma edad");
  });

  it("suma puntos por mismo sexo cuando está especificado", () => {
    const input = makeInput({ sexo: "Femenino" });
    const candidate = makeAdmission({ sexo: "Femenino" });
    const match = scoreSimilarity(input, candidate);
    expect(match!.reasons).toContain("Mismo sexo");
  });

  it("no penaliza si el sexo es No especificado", () => {
    const input = makeInput({ sexo: "No especificado" });
    const candidate = makeAdmission({ sexo: "Femenino" });
    const matchWithUnspecified = scoreSimilarity(input, candidate);
    const inputSpecified = makeInput({ sexo: "Masculino" });
    const matchMismatch = scoreSimilarity(inputSpecified, candidate);
    // No especificado no suma ni resta; sexo distinto tampoco penaliza (solo no suma)
    expect(matchWithUnspecified?.score).toBe(matchMismatch?.score ?? matchWithUnspecified?.score);
  });
});

describe("scoreSimilarity — umbral de score", () => {
  it("retorna null si el score es bajo (persona completamente distinta)", () => {
    const input = makeInput({ nombres: "Carlos", apellidos: "Mendoza", cedula: null });
    const candidate = makeAdmission({
      nombres: "Xiomara",
      apellidos: "Valderrama",
      cedula: null,
      edad: 80,
      sexo: "Femenino",
      fecha_ingreso: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
    });
    expect(scoreSimilarity(input, candidate)).toBeNull();
  });
});

describe("rankSimilarMatches", () => {
  it("ordena por score descendente", () => {
    const input = makeInput({ nombres: "Maria", apellidos: "Perez", cedula: "11111111" });
    const candidates = [
      makeAdmission({ id: 1, nombres: "Mario", apellidos: "Perez" }),
      makeAdmission({ id: 2, nombres: "Maria", apellidos: "Perez", cedula: "V-11111111" }),
    ];
    const results = rankSimilarMatches(input, candidates);
    expect(results[0].admission.id).toBe(2); // cédula exacta va primero
  });

  it("filtra candidatos que no alcanzan el umbral", () => {
    const input = makeInput({ nombres: "Pedro", apellidos: "Sanchez" });
    const candidates = [
      makeAdmission({ nombres: "Xiomara", apellidos: "Valderrama", cedula: null }),
    ];
    expect(rankSimilarMatches(input, candidates)).toHaveLength(0);
  });
});

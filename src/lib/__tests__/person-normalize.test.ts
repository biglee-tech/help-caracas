import { describe, expect, it } from "vitest";

import {
  buildNameVariants,
  formatCedulaForDisplay,
  formatDisplayName,
  normalizeCedula,
  normalizeText,
  tokenizeName,
} from "@/lib/person-normalize";

describe("normalizeText", () => {
  it("quita acentos", () => {
    expect(normalizeText("María")).toBe("maria");
    expect(normalizeText("José")).toBe("jose");
    expect(normalizeText("Ángel")).toBe("angel");
  });

  it("convierte a minúsculas", () => {
    expect(normalizeText("RODRIGUEZ")).toBe("rodriguez");
  });

  it("colapsa espacios múltiples", () => {
    expect(normalizeText("Juan   Carlos")).toBe("juan carlos");
  });

  it("recorta espacios extremos", () => {
    expect(normalizeText("  Ana  ")).toBe("ana");
  });
});

describe("normalizeCedula", () => {
  it("extrae solo los dígitos", () => {
    expect(normalizeCedula("V-12.345.678")).toBe("12345678");
    expect(normalizeCedula("V-12345678")).toBe("12345678");
    expect(normalizeCedula("12345678")).toBe("12345678");
  });

  it("retorna null para valores vacíos", () => {
    expect(normalizeCedula(null)).toBeNull();
    expect(normalizeCedula(undefined)).toBeNull();
    expect(normalizeCedula("")).toBeNull();
    expect(normalizeCedula("V-")).toBeNull();
  });

  it("dos cédulas equivalen si los dígitos coinciden", () => {
    expect(normalizeCedula("V-12.345.678")).toBe(normalizeCedula("12345678"));
  });
});

describe("formatCedulaForDisplay", () => {
  it("formatea con prefijo V-", () => {
    expect(formatCedulaForDisplay("12345678")).toBe("V-12345678");
    expect(formatCedulaForDisplay("V-12345678")).toBe("V-12345678");
  });

  it("retorna null para valores vacíos", () => {
    expect(formatCedulaForDisplay(null)).toBeNull();
    expect(formatCedulaForDisplay("")).toBeNull();
  });
});

describe("tokenizeName", () => {
  it("devuelve tokens únicos sin stop words", () => {
    const tokens = tokenizeName("María José", "de la Cruz");
    expect(tokens).toContain("maria");
    expect(tokens).toContain("jose");
    expect(tokens).toContain("cruz");
    expect(tokens).not.toContain("de");
    expect(tokens).not.toContain("la");
  });

  it("elimina duplicados", () => {
    const tokens = tokenizeName("Ana Ana", "García");
    expect(tokens.filter((t) => t === "ana")).toHaveLength(1);
  });

  it("descarta tokens de menos de 2 caracteres", () => {
    const tokens = tokenizeName("A B", "García");
    expect(tokens).not.toContain("a");
    expect(tokens).not.toContain("b");
  });
});

describe("buildNameVariants", () => {
  it("incluye el nombre completo y la versión invertida", () => {
    const variants = buildNameVariants("Ana", "Rodríguez");
    expect(variants).toContain("ana rodriguez");
    expect(variants).toContain("rodriguez ana");
  });

  it("normaliza acentos en las variantes", () => {
    const variants = buildNameVariants("María", "García");
    expect(variants).toContain("maria garcia");
  });
});

describe("formatDisplayName", () => {
  it("capitaliza cada palabra", () => {
    expect(formatDisplayName("MARIA JOSE")).toBe("Maria Jose");
    expect(formatDisplayName("rodríguez")).toBe("Rodríguez");
  });

  it("colapsa espacios extras", () => {
    expect(formatDisplayName("  ana   garcia  ")).toBe("Ana Garcia");
  });
});

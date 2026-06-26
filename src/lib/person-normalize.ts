const STOP_WORDS = new Set(["de", "del", "la", "las", "los", "y"]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeCedula(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function tokenizeName(nombres: string, apellidos: string): string[] {
  const combined = `${nombres} ${apellidos}`;
  const tokens = normalizeText(combined)
    .split(" ")
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

  return [...new Set(tokens)];
}

export function buildNameVariants(nombres: string, apellidos: string): string[] {
  const normalizedNombres = normalizeText(nombres);
  const normalizedApellidos = normalizeText(apellidos);
  const full = `${normalizedNombres} ${normalizedApellidos}`.trim();
  const reversed = `${normalizedApellidos} ${normalizedNombres}`.trim();

  return [...new Set([full, reversed].filter(Boolean))];
}

export function formatDisplayName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (word.length === 0) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatCedulaForDisplay(value: string | null | undefined): string | null {
  const digits = normalizeCedula(value);
  if (!digits) {
    return null;
  }

  return `V-${digits}`;
}

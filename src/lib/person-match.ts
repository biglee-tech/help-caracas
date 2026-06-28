import {
  buildNameVariants,
  normalizeCedula,
  normalizeText,
  tokenizeName,
} from "@/lib/person-normalize";
import type { EmergencyAdmission, SimilarityInput, SimilarMatch } from "@/lib/types";

const DEFAULT_THRESHOLD = 60;

export function getSimilarityThreshold(): number {
  const configured = Number(process.env.SIMILAR_SCORE_THRESHOLD);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_THRESHOLD;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function nameSimilarityRatio(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 0 : 1 - distance / maxLength;
}

function hoursSince(dateValue: string, reference = new Date()): number {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return (reference.getTime() - timestamp) / (1000 * 60 * 60);
}

export function scoreSimilarity(
  input: SimilarityInput,
  candidate: EmergencyAdmission,
): SimilarMatch | null {
  const inputCedula = normalizeCedula(input.cedula);
  const candidateCedula = normalizeCedula(candidate.cedula);

  if (inputCedula && candidateCedula && inputCedula !== candidateCedula) {
    return null;
  }

  let score = 0;
  const reasons: string[] = [];

  if (inputCedula && candidateCedula && inputCedula === candidateCedula) {
    score += 100;
    reasons.push("Misma cedula");
  }

  const inputTokens = tokenizeName(input.nombres, input.apellidos);
  const candidateTokens = tokenizeName(candidate.nombres, candidate.apellidos);
  const sharedTokens = inputTokens.filter((token) => candidateTokens.includes(token));

  if (sharedTokens.length >= 2) {
    score += 40;
    reasons.push(`${sharedTokens.length} nombres en comun`);
  } else if (sharedTokens.length === 1 && inputTokens.length <= 2) {
    score += 20;
    reasons.push("Nombre parcial en comun");
  }

  const inputVariants = buildNameVariants(input.nombres, input.apellidos);
  const candidateVariants = buildNameVariants(candidate.nombres, candidate.apellidos);
  const bestNameRatio = inputVariants.reduce((best, inputVariant) => {
    const ratio = candidateVariants.reduce((innerBest, candidateVariant) => {
      return Math.max(innerBest, nameSimilarityRatio(inputVariant, candidateVariant));
    }, 0);

    return Math.max(best, ratio);
  }, 0);

  if (bestNameRatio >= 0.85) {
    score += 30;
    reasons.push("Nombre muy parecido");
  } else if (bestNameRatio >= 0.7) {
    score += 15;
    reasons.push("Nombre parecido");
  }

  if (
    input.edad !== null &&
    input.edad !== undefined &&
    candidate.edad !== null &&
    input.edad === candidate.edad
  ) {
    score += 15;
    reasons.push("Misma edad");
  }

  if (
    input.sexo &&
    candidate.sexo &&
    input.sexo !== "No especificado" &&
    candidate.sexo !== "No especificado" &&
    normalizeText(input.sexo) === normalizeText(candidate.sexo)
  ) {
    score += 10;
    reasons.push("Mismo sexo");
  }

  if (
    input.hospital_id &&
    candidate.hospital_id &&
    input.hospital_id === candidate.hospital_id
  ) {
    score += 15;
    reasons.push("Mismo hospital");
  }

  const elapsedHours = hoursSince(candidate.fecha_ingreso);
  if (elapsedHours <= 2) {
    score += 20;
    reasons.push("Registrado en las ultimas 2 horas");
  } else if (elapsedHours <= 24) {
    score += 10;
    reasons.push("Registrado hoy");
  }

  if (score < getSimilarityThreshold()) {
    return null;
  }

  return {
    admission: candidate,
    score,
    reasons,
  };
}

export function rankSimilarMatches(
  input: SimilarityInput,
  candidates: EmergencyAdmission[],
): SimilarMatch[] {
  return candidates
    .map((candidate) => scoreSimilarity(input, candidate))
    .filter((match): match is SimilarMatch => match !== null)
    .sort((left, right) => right.score - left.score);
}

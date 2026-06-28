import { admissionStatuses, sexOptions } from "@/lib/validation";

/**
 * Parser CSV robusto (RFC 4180): maneja campos entre comillas con comas,
 * saltos de linea y comillas escapadas (""), ademas de quitar el BOM.
 * El split ingenuo por comas corrompe datos de OCR que traen comas en
 * procedencia o servicio.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const records = parseRecords(text.replace(/^﻿/, ""));

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = records[0].map((header) => header.trim().toLowerCase());
  const rows = records
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""));

  return { headers, rows };
}

function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\r") {
      i += 1;
      continue;
    }

    if (char === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  return records;
}

/**
 * Normaliza valores de sexo desde OCR ("M", "f", "varon") al enum esperado.
 * Ante un valor desconocido devuelve "No especificado" para no descartar a la persona.
 */
export function normalizeSexo(value: string | undefined): (typeof sexOptions)[number] {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (["m", "masculino", "hombre", "varon", "varón"].includes(normalized)) {
    return "Masculino";
  }

  if (["f", "femenino", "mujer", "hembra"].includes(normalized)) {
    return "Femenino";
  }

  return "No especificado";
}

/**
 * Normaliza el estado desde OCR a uno de los estados validos.
 * Ante un valor desconocido o vacio devuelve "Pendiente".
 */
export function normalizeEstado(value: string | undefined): (typeof admissionStatuses)[number] {
  const normalized = value?.trim().toLowerCase() ?? "";

  const exact = admissionStatuses.find((status) => status.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  if (["fallecido", "fallecida", "muerto", "muerta", "deceso", "fallece"].includes(normalized)) {
    return "Fallecido";
  }
  if (["atendido", "atendida", "alta", "egreso"].includes(normalized)) {
    return "Atendido";
  }
  if (["en atencion", "en atención", "atencion", "atención", "hospitalizado", "hospitalizada"].includes(normalized)) {
    return "En atencion";
  }
  if (["referido", "referida", "trasladado", "trasladada", "traslado"].includes(normalized)) {
    return "Referido";
  }

  return "Pendiente";
}

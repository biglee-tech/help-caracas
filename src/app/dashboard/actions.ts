"use server";

import { revalidatePath } from "next/cache";

import { ADMISSION_SELECT, normalizeAdmissionRow } from "@/lib/admissions-query";
import { normalizeEstado, normalizeSexo } from "@/lib/csv";
import { resolveHospitalId } from "@/lib/hospitals";
import {
  buildFillEmptyUpdates,
  formatFilledFieldsSummary,
  normalizeAdmissionNames,
  recordAllowsPublicUpdate,
} from "@/lib/merge-rules";
import {
  formatCedulaForDisplay,
  formatDisplayName,
  normalizeCedula,
} from "@/lib/person-normalize";
import {
  findSimilarAdmissions,
  toSimilarMatchSummary,
} from "@/lib/similar-admissions";
import { createClient } from "@/lib/supabase/server";
import type { AdmissionActionState, EditAdmissionState } from "@/lib/types";
import {
  admissionSchema,
  editAdmissionSchema,
  formDataToAdmissionInput,
  formDataToEditAdmissionInput,
  getFieldErrors,
} from "@/lib/validation";

function readFormFlag(formData: FormData, key: string) {
  return formData.get(key) === "1";
}

function readExistingAdmissionId(formData: FormData) {
  const value = Number(formData.get("use_existing_id"));
  return Number.isInteger(value) && value > 0 ? value : null;
}

async function completarVaciosExistente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  existingId: number,
  admissionInput: ReturnType<typeof admissionSchema.parse>,
) {
  const { data, error: fetchError } = await supabase
    .from("ingresos_emergencia")
    .select(ADMISSION_SELECT)
    .eq("id", existingId)
    .maybeSingle();

  if (fetchError || !data) {
    return {
      ok: false as const,
      message: "No encontramos el registro existente seleccionado.",
    };
  }

  const existing = normalizeAdmissionRow(data);

  if (!existing) {
    return {
      ok: false as const,
      message: "No encontramos el registro existente seleccionado.",
    };
  }

  const { updates, filledFields } = buildFillEmptyUpdates(existing, admissionInput);

  if (Object.keys(updates).length === 0) {
    revalidatePath("/dashboard");
    return {
      ok: true as const,
      message: `Esta persona ya estaba registrada (#${existingId}). No habia datos nuevos por agregar.`,
      resetKey: Date.now(),
    };
  }

  if (!recordAllowsPublicUpdate(existing)) {
    return {
      ok: false as const,
      message:
        "Este registro ya tiene todos los datos completos. Usa 'Editar registro' para modificarlo.",
    };
  }

  const payload: Record<string, unknown> = { ...updates };

  if (updates.cedula !== undefined) {
    payload.cedula = formatCedulaForDisplay(updates.cedula);
  }

  const { error: updateError } = await supabase
    .from("ingresos_emergencia")
    .update(payload)
    .eq("id", existingId);

  if (updateError) {
    console.error("completarVaciosExistente failed", {
      existingId,
      filledFields,
      error: updateError.message,
    });

    return {
      ok: false as const,
      message:
        "No pudimos completar el registro existente. Revisa que el ingreso tenga algun dato vacio (cedula, edad o procedencia).",
    };
  }

  revalidatePath("/dashboard");

  const filledSummary = formatFilledFieldsSummary(filledFields);

  return {
    ok: true as const,
    message: `Datos agregados al registro #${existingId}. Se agrego: ${filledSummary}.`,
    resetKey: Date.now(),
  };
}

export async function createAdmission(
  _previousState: AdmissionActionState,
  formData: FormData,
): Promise<AdmissionActionState> {
  const supabase = await createClient();

  const parsed = admissionSchema.safeParse(formDataToAdmissionInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados antes de guardar.",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const hospitalResult = await resolveHospitalId(supabase, parsed.data);

  if ("error" in hospitalResult) {
    return {
      ok: false,
      message: hospitalResult.error,
      fieldErrors: hospitalResult.field
        ? { [hospitalResult.field]: hospitalResult.error }
        : undefined,
    };
  }

  const existingAdmissionId = readExistingAdmissionId(formData);

  if (existingAdmissionId) {
    return completarVaciosExistente(supabase, existingAdmissionId, parsed.data);
  }

  const confirmNotDuplicate = readFormFlag(formData, "confirm_not_duplicate");

  if (!confirmNotDuplicate) {
    const similarMatches = await findSimilarAdmissions(supabase, {
      nombres: parsed.data.nombres,
      apellidos: parsed.data.apellidos,
      cedula: parsed.data.cedula,
      edad: parsed.data.edad ?? null,
      sexo: parsed.data.sexo,
      hospital_id: hospitalResult.hospitalId,
    });

    if (similarMatches.length > 0) {
      return {
        ok: false,
        message:
          "Encontramos ingresos similares. Revisa la lista antes de crear otro registro.",
        needsConfirmation: true,
        similarMatches: similarMatches.map(toSimilarMatchSummary),
      };
    }
  }

  const normalizedNames = normalizeAdmissionNames(parsed.data);

  const { error } = await supabase.from("ingresos_emergencia").insert({
    nombres: normalizedNames.nombres,
    apellidos: normalizedNames.apellidos,
    cedula: formatCedulaForDisplay(parsed.data.cedula),
    edad: parsed.data.edad ?? null,
    sexo: parsed.data.sexo,
    procedencia: parsed.data.procedencia,
    hospital_id: hospitalResult.hospitalId,
    servicio_requerido: parsed.data.servicio_requerido,
    estado: parsed.data.estado,
  });

  if (error) {
    return {
      ok: false,
      message:
        "No pudimos registrar el ingreso. Verifica la conexion e intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard");

  const successMessage =
    parsed.data.hospital_mode === "custom"
      ? "Ingreso registrado correctamente. El hospital quedo disponible para futuros registros."
      : "Ingreso registrado correctamente.";

  return {
    ok: true,
    message: successMessage,
    resetKey: Date.now(),
  };
}

/** Valores crudos (strings) de una fila del CSV, mapeados por columna. */
export type CsvRowRaw = {
  nombres?: string;
  apellidos?: string;
  edad?: string;
  sexo?: string;
  cedula?: string;
  procedencia?: string;
  servicio_requerido?: string;
  estado?: string;
};

export type BulkImportResult = {
  imported: number;
  skipped: number;
  failed: { row: number; reason: string }[];
};

const INSERT_CHUNK_SIZE = 200;

type ValidEntry = {
  rowNumber: number;
  record: Record<string, unknown>;
  cedulaDigits: string | null;
};

function parseCsvEdad(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 130 ? parsed : null;
}

export async function bulkCreateAdmissions(
  rawRows: CsvRowRaw[],
  hospitalId: number,
  options?: { skipDuplicates?: boolean },
): Promise<BulkImportResult> {
  const supabase = await createClient();

  if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
    return {
      imported: 0,
      skipped: 0,
      failed: rawRows.map((_, index) => ({
        row: index + 1,
        reason: "Centro de salud invalido",
      })),
    };
  }

  const failed: BulkImportResult["failed"] = [];
  const valid: ValidEntry[] = [];

  // 1. Validar y normalizar cada fila. Solo falla si no hay nombres/apellidos;
  //    el resto se completa con defaults sensatos para no descartar personas.
  rawRows.forEach((raw, index) => {
    const rowNumber = index + 1;
    const nombres = raw.nombres?.trim() ?? "";
    const apellidos = raw.apellidos?.trim() ?? "";

    if (!nombres || !apellidos) {
      failed.push({ row: rowNumber, reason: "Falta nombres o apellidos" });
      return;
    }

    const cedula = raw.cedula?.trim() ? formatCedulaForDisplay(raw.cedula.trim()) : null;

    valid.push({
      rowNumber,
      cedulaDigits: normalizeCedula(cedula),
      record: {
        nombres: formatDisplayName(nombres),
        apellidos: formatDisplayName(apellidos),
        sexo: normalizeSexo(raw.sexo),
        edad: parseCsvEdad(raw.edad),
        cedula,
        procedencia: raw.procedencia?.trim() || null,
        servicio_requerido: raw.servicio_requerido?.trim() || "Sin especificar",
        estado: normalizeEstado(raw.estado),
        hospital_id: hospitalId,
      },
    });
  });

  // 2. (Opcional) Saltar duplicados por cedula: dentro del archivo y contra la DB.
  let skipped = 0;
  let toInsert = valid;

  if (options?.skipDuplicates) {
    const importCedulas = valid
      .map((entry) => entry.cedulaDigits)
      .filter((digits): digits is string => digits !== null);

    const existing = new Set<string>();

    if (importCedulas.length > 0) {
      const { data } = await supabase
        .from("ingresos_emergencia")
        .select("cedula")
        .in("cedula", importCedulas.map((digits) => `V-${digits}`));

      for (const row of data ?? []) {
        const digits = normalizeCedula((row as { cedula: string | null }).cedula);
        if (digits) {
          existing.add(digits);
        }
      }
    }

    const seen = new Set<string>();
    toInsert = valid.filter((entry) => {
      if (!entry.cedulaDigits) {
        return true; // sin cedula no se puede deduplicar de forma confiable
      }
      if (existing.has(entry.cedulaDigits) || seen.has(entry.cedulaDigits)) {
        skipped += 1;
        return false;
      }
      seen.add(entry.cedulaDigits);
      return true;
    });
  }

  // 3. Insertar por lotes; si un lote falla, reintentar fila por fila para
  //    reportar exactamente cuales fallaron.
  let imported = 0;

  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK_SIZE);
    const { error } = await supabase
      .from("ingresos_emergencia")
      .insert(chunk.map((entry) => entry.record));

    if (!error) {
      imported += chunk.length;
      continue;
    }

    for (const entry of chunk) {
      const { error: rowError } = await supabase
        .from("ingresos_emergencia")
        .insert(entry.record);

      if (rowError) {
        failed.push({ row: entry.rowNumber, reason: "Error al guardar en la base de datos" });
      } else {
        imported += 1;
      }
    }
  }

  failed.sort((a, b) => a.row - b.row);
  revalidatePath("/dashboard");

  return { imported, skipped, failed };
}

export async function editAdmission(
  _prev: EditAdmissionState,
  formData: FormData,
): Promise<EditAdmissionState> {
  const supabase = await createClient();

  const parsed = editAdmissionSchema.safeParse(formDataToEditAdmissionInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados antes de guardar.",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const { id, estado, servicio_requerido, cedula, edad, procedencia, sexo } = parsed.data;

  const { error } = await supabase
    .from("ingresos_emergencia")
    .update({
      estado,
      servicio_requerido,
      cedula: formatCedulaForDisplay(cedula),
      edad: edad ?? null,
      procedencia: procedencia ?? null,
      sexo,
    })
    .eq("id", id);

  if (error) {
    console.error("editAdmission failed", { id, error: error.message });
    return {
      ok: false,
      message:
        "No pudimos actualizar el registro. Verifica que el ingreso pueda ser editado e intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `Registro #${id} actualizado correctamente.`,
  };
}

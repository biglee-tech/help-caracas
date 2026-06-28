"use server";

import { revalidatePath } from "next/cache";

import { resolveHospitalId } from "@/lib/hospitals";
import {
  buildFillEmptyUpdates,
  formatFilledFieldsSummary,
  normalizeAdmissionNames,
  recordAllowsPublicUpdate,
} from "@/lib/merge-rules";
import { formatCedulaForDisplay } from "@/lib/person-normalize";
import {
  findSimilarAdmissions,
  toSimilarMatchSummary,
} from "@/lib/similar-admissions";
import { createClient } from "@/lib/supabase/server";
import type { AdmissionActionState, EditAdmissionState, EmergencyAdmission } from "@/lib/types";
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

function normalizeAdmissionRow(data: unknown): EmergencyAdmission | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const admission = data as EmergencyAdmission & {
    hospitales?: EmergencyAdmission["hospitales"] | EmergencyAdmission["hospitales"][];
  };
  const hospital = Array.isArray(admission.hospitales)
    ? admission.hospitales[0]
    : admission.hospitales;

  return {
    ...admission,
    hospitales: hospital ?? null,
  };
}

async function completarVaciosExistente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  existingId: number,
  admissionInput: ReturnType<typeof admissionSchema.parse>,
) {
  const { data, error: fetchError } = await supabase
    .from("ingresos_emergencia")
    .select(
      "id,nombres,apellidos,cedula,edad,sexo,procedencia,hospital_id,fecha_ingreso,servicio_requerido,estado,created_at,hospitales(id,nombre,ciudad)",
    )
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
        "Este registro ya tiene cedula, edad y procedencia completos. No se pueden agregar mas datos a ese ingreso.",
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

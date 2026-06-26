"use server";

import { revalidatePath } from "next/cache";

import { resolveHospitalId } from "@/lib/hospitals";
import { normalizeAdmissionNames } from "@/lib/merge-rules";
import { formatCedulaForDisplay } from "@/lib/person-normalize";
import {
  findSimilarAdmissions,
  toSimilarMatchSummary,
} from "@/lib/similar-admissions";
import { createClient } from "@/lib/supabase/server";
import type { AdmissionActionState } from "@/lib/types";
import {
  admissionSchema,
  formDataToAdmissionInput,
  getFieldErrors,
} from "@/lib/validation";

function readFormFlag(formData: FormData, key: string) {
  return formData.get(key) === "1";
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
        "No pudimos registrar el ingreso. Verifica la conexion y las politicas de Supabase.",
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

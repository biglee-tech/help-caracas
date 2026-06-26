"use server";

import { revalidatePath } from "next/cache";

import { resolveHospitalId } from "@/lib/hospitals";
import type { AdmissionActionState } from "@/lib/types";
import {
  admissionSchema,
  formDataToAdmissionInput,
  getFieldErrors,
} from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("ingresos_emergencia").insert({
    nombres: parsed.data.nombres,
    apellidos: parsed.data.apellidos,
    cedula: parsed.data.cedula,
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

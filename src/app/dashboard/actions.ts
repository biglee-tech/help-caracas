"use server";

import { revalidatePath } from "next/cache";

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

  const { error } = await supabase.from("ingresos_emergencia").insert({
    nombres: parsed.data.nombres,
    apellidos: parsed.data.apellidos,
    cedula: parsed.data.cedula,
    edad: parsed.data.edad ?? null,
    sexo: parsed.data.sexo,
    procedencia: parsed.data.procedencia,
    hospital_id: parsed.data.hospital_id,
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

  return {
    ok: true,
    message: "Ingreso registrado correctamente.",
  };
}

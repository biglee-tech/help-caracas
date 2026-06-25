"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AdmissionActionState } from "@/lib/types";
import {
  admissionStatusSchema,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Tu sesion expiro. Inicia sesion nuevamente.",
    };
  }

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

export async function updateAdmissionStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = Number(formData.get("id"));
  const parsedStatus = admissionStatusSchema.safeParse(formData.get("estado"));

  if (!Number.isInteger(id) || id <= 0 || !parsedStatus.success) {
    revalidatePath("/dashboard");
    return;
  }

  await supabase
    .from("ingresos_emergencia")
    .update({ estado: parsedStatus.data })
    .eq("id", id);

  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

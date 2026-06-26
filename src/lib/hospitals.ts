import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdmissionInput } from "@/lib/validation";
import { normalizeHospitalName } from "@/lib/validation";

type ResolveHospitalResult =
  | { hospitalId: number }
  | { error: string; field?: "hospital_id" | "hospital_nombre" };

export async function resolveHospitalId(
  supabase: SupabaseClient,
  data: AdmissionInput,
): Promise<ResolveHospitalResult> {
  if (data.hospital_mode === "existing") {
    if (!data.hospital_id) {
      return {
        error: "Selecciona un hospital.",
        field: "hospital_id",
      };
    }

    return { hospitalId: data.hospital_id };
  }

  const nombre = normalizeHospitalName(data.hospital_nombre ?? "");
  const ciudad = data.hospital_ciudad?.trim() || null;

  if (nombre.length < 3) {
    return {
      error: "Nombre del hospital es obligatorio.",
      field: "hospital_nombre",
    };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("hospitales")
    .select("id")
    .ilike("nombre", nombre)
    .maybeSingle();

  if (lookupError) {
    return { error: "No pudimos verificar el hospital." };
  }

  if (existing) {
    return { hospitalId: existing.id };
  }

  const { data: created, error: insertError } = await supabase
    .from("hospitales")
    .insert({ nombre, ciudad })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: duplicate } = await supabase
        .from("hospitales")
        .select("id")
        .ilike("nombre", nombre)
        .maybeSingle();

      if (duplicate) {
        return { hospitalId: duplicate.id };
      }
    }

    return {
      error:
        "No pudimos registrar el hospital. Verifica las politicas RLS de Supabase.",
      field: "hospital_nombre",
    };
  }

  return { hospitalId: created.id };
}

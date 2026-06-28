import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import {
  findSimilarAdmissions,
  toSimilarMatchSummary,
} from "@/lib/similar-admissions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function sanitizeQueryValue(value: string | null, maxLength = 80) {
  return value?.trim().replace(/[%,()]/g, "").slice(0, maxLength) ?? "";
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ matches: [] });
  }

  const { searchParams } = new URL(request.url);
  const nombres = sanitizeQueryValue(searchParams.get("nombres"));
  const apellidos = sanitizeQueryValue(searchParams.get("apellidos"));

  if (nombres.length < 2 && apellidos.length < 2) {
    return NextResponse.json({ matches: [] });
  }

  const supabase = await createClient();
  const hospitalId = Number(searchParams.get("hospital_id"));
  const edadValue = searchParams.get("edad");
  const parsedEdad = edadValue ? Number(edadValue) : null;

  const matches = await findSimilarAdmissions(supabase, {
    nombres,
    apellidos,
    cedula: sanitizeQueryValue(searchParams.get("cedula"), 32) || null,
    edad: Number.isInteger(parsedEdad) ? parsedEdad : null,
    sexo: sanitizeQueryValue(searchParams.get("sexo"), 32) || undefined,
    hospital_id:
      Number.isInteger(hospitalId) && hospitalId > 0 ? hospitalId : undefined,
  });

  return NextResponse.json({
    matches: matches.map(toSimilarMatchSummary),
  });
}

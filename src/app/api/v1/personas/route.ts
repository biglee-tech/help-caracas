import { NextRequest, NextResponse } from "next/server";

import {
  ADMISSION_SELECT,
  buildSearchOrClause,
  normalizeAdmissionRows,
  normalizeSearchTerm,
} from "@/lib/admissions-query";
import { isSupabaseConfigured } from "@/lib/env";
import {
  checkPublicApiRateLimit,
  logPublicApiAccess,
  rateLimitHeaders,
} from "@/lib/public-api-access";
import {
  PUBLIC_API_SORT_OPTIONS,
  parsePublicApiPagination,
  parsePublicApiSort,
  toPublicAdmission,
} from "@/lib/public-search";
import { getClientIp } from "@/lib/request-ip";
import { sexOptions } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EVENT = "public_api_personas_access";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkPublicApiRateLimit(ip);

  if (!rateLimit.allowed) {
    logPublicApiAccess({ event: EVENT, ip, status: 429, rateLimited: true });
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  if (!isSupabaseConfigured()) {
    logPublicApiAccess({ event: EVENT, ip, status: 500, rateLimited: false });
    return NextResponse.json(
      { error: "Supabase no esta configurado." },
      { status: 500, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const params = request.nextUrl.searchParams;
  const { page, pageSize } = parsePublicApiPagination(params);
  const sort = parsePublicApiSort(params.get("sort"));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // El filtro por nombre de hospital requiere !inner para que PostgREST
  // filtre filas y no solo datos del join. El esquema garantiza que
  // hospital_id NOT NULL, así que !inner no excluye registros válidos.
  const hospital = normalizeSearchTerm(params.get("hospital"));
  const selectStr = hospital
    ? ADMISSION_SELECT.replace("hospitales(", "hospitales!inner(")
    : ADMISSION_SELECT;

  const supabase = await createClient();

  let query = supabase
    .from("ingresos_emergencia")
    .select(selectStr, { count: "exact" })
    .range(from, to);

  for (const { column, ascending } of PUBLIC_API_SORT_OPTIONS[sort]) {
    query = query.order(column, { ascending });
  }

  const searchTerm = normalizeSearchTerm(params.get("q"));
  if (searchTerm) {
    query = query.or(buildSearchOrClause(searchTerm));
  }

  const estado = params.get("estado");
  if (estado) {
    query = query.eq("estado", estado);
  }

  const sexo = params.get("sexo");
  if (sexo && (sexOptions as readonly string[]).includes(sexo)) {
    query = query.eq("sexo", sexo);
  }

  if (hospital) {
    query = query.ilike("hospitales.nombre", `%${hospital}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    logPublicApiAccess({ event: EVENT, ip, status: 500, rateLimited: false });
    return NextResponse.json(
      { error: "No pudimos consultar el registro." },
      { status: 500, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const admissions = normalizeAdmissionRows(data).map(toPublicAdmission);

  logPublicApiAccess({
    event: EVENT,
    ip,
    status: 200,
    rateLimited: false,
    resultCount: admissions.length,
  });

  return NextResponse.json(
    {
      data: admissions,
      page,
      page_size: pageSize,
      total: count ?? admissions.length,
    },
    { headers: rateLimitHeaders(rateLimit) },
  );
}

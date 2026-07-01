import { NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import {
  checkPublicApiRateLimit,
  logPublicApiAccess,
  rateLimitHeaders,
} from "@/lib/public-api-access";
import { getClientIp } from "@/lib/request-ip";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EVENT = "public_api_hospitales_access";

/**
 * Catalogo de nombres de hospitales reportando. No expone el id
 * interno de la tabla.
 */
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hospitales")
    .select("nombre,ciudad")
    .order("nombre", { ascending: true });

  if (error) {
    logPublicApiAccess({ event: EVENT, ip, status: 500, rateLimited: false });
    return NextResponse.json(
      { error: "No pudimos consultar los hospitales." },
      { status: 500, headers: rateLimitHeaders(rateLimit) },
    );
  }

  logPublicApiAccess({
    event: EVENT,
    ip,
    status: 200,
    rateLimited: false,
    resultCount: data?.length,
  });

  return NextResponse.json(
    { data: data ?? [] },
    { headers: rateLimitHeaders(rateLimit) },
  );
}

import { NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Hospital } from "@/lib/types";

const CHUNK_SIZE = 1000;

type ExportAdmission = {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  edad: number | null;
  sexo: string | null;
  procedencia: string | null;
  hospital_id: number;
  fecha_ingreso: string;
  servicio_requerido: string;
  estado: string | null;
  created_at: string;
  hospitales: Hospital | Hospital[] | null;
};

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const params = request.nextUrl.searchParams;
  const rows = await fetchAdmissionsForExport(supabase, params);
  const csv = toCsv(rows);
  const filename = `ingresos-emergencia-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

async function fetchAdmissionsForExport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: URLSearchParams,
) {
  const rows: ExportAdmission[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("ingresos_emergencia")
      .select(
        "id,nombres,apellidos,cedula,edad,sexo,procedencia,hospital_id,fecha_ingreso,servicio_requerido,estado,created_at,hospitales(id,nombre,ciudad)",
      )
      .order("fecha_ingreso", { ascending: false })
      .range(from, from + CHUNK_SIZE - 1);

    const hospitalId = Number(params.get("hospital_id"));
    if (Number.isInteger(hospitalId) && hospitalId > 0) {
      query = query.eq("hospital_id", hospitalId);
    }

    const estado = params.get("estado");
    if (estado) {
      query = query.eq("estado", estado);
    }

    const searchTerm = normalizeSearchTerm(params.get("q") ?? undefined);
    if (searchTerm) {
      query = query.or(
        [
          `nombres.ilike.%${searchTerm}%`,
          `apellidos.ilike.%${searchTerm}%`,
          `cedula.ilike.%${searchTerm}%`,
          `sexo.ilike.%${searchTerm}%`,
          `procedencia.ilike.%${searchTerm}%`,
          `servicio_requerido.ilike.%${searchTerm}%`,
        ].join(","),
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const chunk = (data ?? []) as ExportAdmission[];
    rows.push(...chunk);

    if (chunk.length < CHUNK_SIZE) {
      break;
    }

    from += CHUNK_SIZE;
  }

  return rows;
}

function toCsv(rows: ExportAdmission[]) {
  const headers = [
    "ID",
    "Nombres",
    "Apellidos",
    "Cedula",
    "Edad",
    "Sexo",
    "Procedencia",
    "Hospital",
    "Ciudad",
    "Fecha de ingreso",
    "Servicio requerido",
    "Estado",
    "Fecha de registro",
  ];

  const body = rows.map((row) => {
    const hospital = normalizeHospital(row.hospitales);

    return [
      row.id,
      row.nombres,
      row.apellidos,
      row.cedula ?? "",
      row.edad ?? "",
      row.sexo ?? "",
      row.procedencia ?? "",
      hospital?.nombre ?? "",
      hospital?.ciudad ?? "",
      formatDate(row.fecha_ingreso),
      row.servicio_requerido,
      row.estado ?? "",
      formatDate(row.created_at),
    ].map(escapeCsvValue);
  });

  return [headers.map(escapeCsvValue), ...body]
    .map((row) => row.join(","))
    .join("\n");
}

function normalizeHospital(value: Hospital | Hospital[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function escapeCsvValue(value: string | number) {
  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeSearchTerm(value?: string) {
  return value?.trim().replace(/[%,()]/g, "").slice(0, 80);
}

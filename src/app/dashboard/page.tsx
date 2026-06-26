import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { AdmissionForm } from "@/components/admission-form";
import { AdmissionsList } from "@/components/admissions-list";
import { ExportCsvButton } from "@/components/export-csv-button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyAdmission, Hospital } from "@/lib/types";

type DashboardSearchParams = {
  q?: string;
  hospital_id?: string;
  estado?: string;
  page?: string;
};

const PAGE_SIZE = 25;

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: hospitalsData, error: hospitalsError },
    admissionsResult,
    { data: latestAdmission },
    totalAdmissionsResult,
  ] = await Promise.all([
    fetchHospitals(supabase),
    fetchAdmissions(supabase, params),
    fetchLatestAdmission(supabase),
    fetchTotalAdmissions(supabase),
  ]);

  const hospitals = (hospitalsData ?? []) as Hospital[];
  const admissions = normalizeAdmissions(admissionsResult.data ?? []);
  const totalAdmissions = admissionsResult.count ?? 0;
  const totalRegistered = totalAdmissionsResult.count ?? totalAdmissions;
  const currentPage = getCurrentPage(params.page);
  const totalPages = Math.max(1, Math.ceil(totalAdmissions / PAGE_SIZE));
  const visibleFrom = totalAdmissions === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const visibleTo = Math.min(currentPage * PAGE_SIZE, totalAdmissions);
  const lastUpdatedAt = latestAdmission?.created_at
    ? formatSummaryDate(new Date(latestAdmission.created_at))
    : "Sin registros";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)]">
      <header className="bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent-strong))] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 max-w-full items-start gap-3 sm:items-center">
            <Image
              alt="Biglee"
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
              height={44}
              src="/biglee-logo.png"
              width={44}
            />
            <div className="min-w-0 flex-1">
              <p className="break-words text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/75 sm:text-xs sm:tracking-[0.22em]">
                biglee.io | Ayuda por terremoto en Venezuela
              </p>
              <h1 className="mt-1 max-w-full text-balance text-base font-black leading-tight sm:text-2xl">
                Centro de Registro de Ingresos Hospitalarios
              </h1>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-7">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <SummaryCard label="Hospitales reportando" value={hospitals.length} />
            <SummaryCard label="Pacientes registrados" value={totalRegistered} />
            <SummaryCard label="Actualizacion reciente" value={lastUpdatedAt} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-3 py-5 sm:gap-6 sm:px-4 sm:py-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <section className="min-w-0 h-fit max-w-full rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[var(--brand-border)] sm:p-5 md:p-6">
          {hospitalsError ? (
            <Alert
              message="No pudimos cargar hospitales. Revisa Supabase y las politicas RLS."
              tone="error"
            />
          ) : null}
          <AdmissionForm hospitals={hospitals} />
        </section>

        <section className="min-w-0 max-w-full space-y-5">
          <div className="min-w-0 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[var(--brand-border)] sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-strong)]">
                  Buscar por paciente
                </p>
                <h2 className="mt-1 text-xl font-black text-[var(--foreground)] sm:text-2xl">
                  Consultar ingresos
                </h2>
                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  Filtra por paciente, procedencia, hospital o estado.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-sm font-bold text-[var(--brand-accent-strong)]">
                  {totalRegistered} registros
                </p>
                <ExportCsvButton href={getExportHref(params)} />
              </div>
            </div>

            <form className="mt-5 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
              <input
                className="min-h-12 min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                defaultValue={params.q ?? ""}
                name="q"
                placeholder="Buscar nombre, cedula, procedencia..."
                type="search"
              />
              <select
                className="min-h-12 min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                defaultValue={params.hospital_id ?? ""}
                name="hospital_id"
              >
                <option value="">Todos los hospitales</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.nombre}
                  </option>
                ))}
              </select>
              <select
                className="min-h-12 min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                defaultValue={params.estado ?? ""}
                name="estado"
              >
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En atencion">En atencion</option>
                <option value="Referido">Referido</option>
                <option value="Atendido">Atendido</option>
              </select>
              <button className="min-h-12 rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)]">
                Buscar
              </button>
            </form>
          </div>

          {admissionsResult.error ? (
            <Alert
              message="No pudimos consultar ingresos. Revisa la conexion y las politicas RLS."
              tone="error"
            />
          ) : null}

          <AdmissionsList admissions={admissions} />
          <Pagination
            currentPage={currentPage}
            params={params}
            totalPages={totalPages}
            visibleFrom={visibleFrom}
            visibleTo={visibleTo}
            total={totalAdmissions}
          />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 ring-1 ring-[var(--brand-border)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-black leading-tight text-[var(--foreground)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function formatSummaryDate(value: Date) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function Pagination({
  currentPage,
  params,
  totalPages,
  visibleFrom,
  visibleTo,
  total,
}: {
  currentPage: number;
  params: DashboardSearchParams;
  totalPages: number;
  visibleFrom: number;
  visibleTo: number;
  total: number;
}) {
  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <nav className="flex flex-col gap-3 rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-[var(--brand-border)] sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold text-[var(--brand-muted)]">
        Mostrando {visibleFrom}-{visibleTo} de {total}
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink
          disabled={currentPage <= 1}
          href={getPageHref(params, previousPage)}
        >
          Anterior
        </PaginationLink>
        <span className="rounded-2xl border border-[var(--brand-border)] px-4 py-2 font-bold text-[var(--foreground)]">
          {currentPage} / {totalPages}
        </span>
        <PaginationLink
          disabled={currentPage >= totalPages}
          href={getPageHref(params, nextPage)}
        >
          Siguiente
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
}: {
  children: React.ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-2xl border border-[var(--brand-border)] px-4 py-2 font-bold text-slate-300">
        {children}
      </span>
    );
  }

  return (
    <Link
      className="rounded-2xl border border-[var(--brand-border)] px-4 py-2 font-bold text-[var(--foreground)] transition hover:border-[var(--brand-accent-strong)]"
      href={href}
    >
      {children}
    </Link>
  );
}

function getPageHref(params: DashboardSearchParams, page: number) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.hospital_id) {
    searchParams.set("hospital_id", params.hospital_id);
  }

  if (params.estado) {
    searchParams.set("estado", params.estado);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

function getExportHref(params: DashboardSearchParams) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.hospital_id) {
    searchParams.set("hospital_id", params.hospital_id);
  }

  if (params.estado) {
    searchParams.set("estado", params.estado);
  }

  const query = searchParams.toString();
  return query ? `/api/export?${query}` : "/api/export";
}

function fetchHospitals(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("hospitales")
    .select("id,nombre,ciudad")
    .order("nombre", { ascending: true });
}

function fetchLatestAdmission(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("ingresos_emergencia")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

function fetchTotalAdmissions(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("ingresos_emergencia")
    .select("id", { count: "exact", head: true });
}

function fetchAdmissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: DashboardSearchParams,
) {
  const currentPage = getCurrentPage(params.page);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("ingresos_emergencia")
    .select(
      "id,nombres,apellidos,cedula,edad,sexo,procedencia,hospital_id,fecha_ingreso,servicio_requerido,estado,created_at,hospitales(id,nombre,ciudad)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const hospitalId = Number(params.hospital_id);
  if (Number.isInteger(hospitalId) && hospitalId > 0) {
    query = query.eq("hospital_id", hospitalId);
  }

  if (params.estado) {
    query = query.eq("estado", params.estado);
  }

  const searchTerm = normalizeSearchTerm(params.q);
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

  return query;
}

function getCurrentPage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeSearchTerm(value?: string) {
  return value?.trim().replace(/[%,()]/g, "").slice(0, 80);
}

function normalizeAdmissions(data: unknown): EmergencyAdmission[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const admission = item as EmergencyAdmission & {
      hospitales?: Hospital | Hospital[] | null;
    };
    const hospital = Array.isArray(admission.hospitales)
      ? admission.hospitales[0]
      : admission.hospitales;

    return {
      ...admission,
      hospitales: hospital ?? null,
    };
  });
}

function Alert({ message, tone }: { message: string; tone: "error" }) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-[var(--brand-border)] bg-white text-[var(--brand-muted)]";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${classes}`}>
      {message}
    </div>
  );
}

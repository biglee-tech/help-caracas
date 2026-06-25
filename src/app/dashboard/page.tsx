import { redirect } from "next/navigation";
import Image from "next/image";

import { signOut } from "@/app/dashboard/actions";
import { AdmissionForm } from "@/components/admission-form";
import { AdmissionsList } from "@/components/admissions-list";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyAdmission, Hospital } from "@/lib/types";

type DashboardSearchParams = {
  q?: string;
  hospital_id?: string;
  estado?: string;
};

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: hospitalsData, error: hospitalsError }, admissionsResult] =
    await Promise.all([fetchHospitals(supabase), fetchAdmissions(supabase, params)]);

  const hospitals = (hospitalsData ?? []) as Hospital[];
  const admissions = normalizeAdmissions(admissionsResult.data ?? []);
  const lastUpdatedAt = formatSummaryDate(new Date());

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent-strong))] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              alt="Biglee"
              className="h-11 w-11 object-contain"
              height={44}
              src="/biglee-logo.png"
              width={44}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                biglee.io | Ayuda por terremoto en Venezuela
              </p>
              <h1 className="mt-1 text-2xl font-black">
                Centro de Registro de Ingresos Hospitalarios
              </h1>
            </div>
          </div>
          <form action={signOut}>
            <button className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25">
              Cerrar sesion
            </button>
          </form>
        </div>
      </header>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Hospitales reportando" value={hospitals.length} />
            <SummaryCard label="Pacientes registrados" value={admissions.length} />
            <SummaryCard label="Actualizacion reciente" value={lastUpdatedAt} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(360px,440px)_1fr]">
        <section className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[var(--brand-border)] md:p-6">
          {hospitalsError ? (
            <Alert
              message="No pudimos cargar hospitales. Revisa Supabase y las politicas RLS."
              tone="error"
            />
          ) : null}
          <AdmissionForm hospitals={hospitals} />
        </section>

        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[var(--brand-border)] md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-strong)]">
                  Buscar por paciente
                </p>
                <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Consultar ingresos
                </h2>
                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  Filtra por paciente, procedencia, hospital o estado.
                </p>
              </div>
              <p className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-sm font-bold text-[var(--brand-accent-strong)]">
                {admissions.length} registros
              </p>
            </div>

            <form className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
              <input
                className="rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                defaultValue={params.q ?? ""}
                name="q"
                placeholder="Buscar nombre, cedula, procedencia..."
                type="search"
              />
              <select
                className="rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
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
                className="rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                defaultValue={params.estado ?? ""}
                name="estado"
              >
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En atencion">En atencion</option>
                <option value="Referido">Referido</option>
                <option value="Atendido">Atendido</option>
              </select>
              <button className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)]">
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
      <p className="mt-2 text-2xl font-black text-[var(--foreground)]">
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

function fetchHospitals(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("hospitales")
    .select("id,nombre,ciudad")
    .order("nombre", { ascending: true });
}

function fetchAdmissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: DashboardSearchParams,
) {
  let query = supabase
    .from("ingresos_emergencia")
    .select(
      "id,nombres,apellidos,cedula,procedencia,hospital_id,fecha_ingreso,servicio_requerido,estado,created_at,hospitales(id,nombre,ciudad)",
    )
    .order("fecha_ingreso", { ascending: false })
    .limit(100);

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
        `procedencia.ilike.%${searchTerm}%`,
        `servicio_requerido.ilike.%${searchTerm}%`,
      ].join(","),
    );
  }

  return query;
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

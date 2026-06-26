import { updateAdmissionStatus } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import type { EmergencyAdmission } from "@/lib/types";
import { admissionStatuses } from "@/lib/validation";

type AdmissionsListProps = {
  admissions: EmergencyAdmission[];
};

export function AdmissionsList({ admissions }: AdmissionsListProps) {
  if (admissions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white p-6 text-center shadow-sm sm:p-8">
        <h3 className="text-base font-black text-[var(--foreground)] sm:text-lg">
          No hay ingresos para mostrar
        </h3>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          Registra un nuevo ingreso o ajusta los filtros de busqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-3">
      {admissions.map((admission) => (
        <article
          className="min-w-0 max-w-full rounded-3xl bg-white p-4 shadow-sm shadow-[rgba(22,63,82,0.08)] ring-1 ring-[var(--brand-border)] sm:p-5"
          key={admission.id}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-base font-black text-[var(--foreground)] sm:text-lg">
                  {admission.nombres} {admission.apellidos}
                </h3>
                <StatusTag status={admission.estado ?? "Pendiente"} />
              </div>
              <p className="mt-1 break-words text-sm text-[var(--brand-muted)]">
                {admission.hospitales?.nombre ?? "Hospital no disponible"}
                {admission.hospitales?.ciudad
                  ? ` - ${admission.hospitales.ciudad}`
                  : ""}
              </p>
            </div>
            <div className="min-w-0 space-y-3 md:min-w-64 md:text-right">
              <time
                className="block text-sm font-semibold text-[var(--brand-muted)]"
                dateTime={admission.fecha_ingreso}
              >
                {formatDate(admission.fecha_ingreso)}
              </time>
              <form
                action={updateAdmissionStatus}
                className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:justify-end"
              >
                <input name="id" type="hidden" value={admission.id} />
                <label className="sr-only" htmlFor={`estado-${admission.id}`}>
                  Cambiar estado
                </label>
                <select
                  className="min-h-11 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)] md:w-auto"
                  defaultValue={admission.estado ?? "Pendiente"}
                  id={`estado-${admission.id}`}
                  name="estado"
                >
                  {admissionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <SubmitButton
                  className="min-h-11 rounded-2xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)]"
                  pendingText="Guardando..."
                >
                  Guardar
                </SubmitButton>
              </form>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-3 text-sm text-[var(--brand-muted)] sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Cedula" value={admission.cedula ?? "Sin dato"} />
            <Info label="Sexo" value={admission.sexo ?? "Sin dato"} />
            <Info
              label="Procedencia"
              value={admission.procedencia ?? "Sin dato"}
            />
            <Info label="Servicio" value={admission.servicio_requerido} />
          </div>
        </article>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--brand-border)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-muted)]">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const className = getStatusClassName(status);

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function getStatusClassName(status: string) {
  switch (status) {
    case "Atendido":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "En atencion":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Referido":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Pendiente":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

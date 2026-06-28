"use client";

import { useState } from "react";

import { AdmissionEditForm } from "@/components/admission-edit-form";
import { formatAdmissionDate } from "@/lib/dates";
import type { EmergencyAdmission, SimilarMatchSummary } from "@/lib/types";

type AdmissionCardProps = {
  admission: EmergencyAdmission;
};

export function AdmissionCard({ admission }: AdmissionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentEstado, setCurrentEstado] = useState(admission.estado ?? "Pendiente");

  const matchForEdit = admissionToMatchSummary(admission);

  if (isEditing) {
    return (
      <article className="min-w-0 max-w-full rounded-3xl bg-white p-4 shadow-sm shadow-[rgba(22,63,82,0.08)] ring-1 ring-[var(--brand-border)] sm:p-5">
        <AdmissionEditForm
          match={{ ...matchForEdit, estado: currentEstado }}
          onCancel={() => setIsEditing(false)}
          onSuccess={(message) => {
            setIsEditing(false);
            setSuccessMessage(message);
          }}
        />
      </article>
    );
  }

  return (
    <article className="min-w-0 max-w-full rounded-3xl bg-white p-4 shadow-sm shadow-[rgba(22,63,82,0.08)] ring-1 ring-[var(--brand-border)] sm:p-5">
      {successMessage ? (
        <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-base font-black text-[var(--foreground)] sm:text-lg">
              {admission.nombres} {admission.apellidos}
            </h3>
            <StatusTag status={currentEstado} />
          </div>
          <p className="mt-1 break-words text-sm text-[var(--brand-muted)]">
            {admission.hospitales?.nombre ?? "Hospital no disponible"}
            {admission.hospitales?.ciudad ? ` - ${admission.hospitales.ciudad}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-3 md:flex-col md:items-end">
          <time
            className="block text-sm font-semibold text-[var(--brand-muted)]"
            dateTime={admission.fecha_ingreso}
            suppressHydrationWarning
          >
            {formatAdmissionDate(admission.fecha_ingreso)}
          </time>
          <button
            className="shrink-0 rounded-2xl border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--brand-accent-strong)] hover:text-[var(--brand-accent-strong)]"
            onClick={() => {
              setSuccessMessage(null);
              setIsEditing(true);
            }}
            type="button"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 text-sm text-[var(--brand-muted)] sm:grid-cols-2 lg:grid-cols-5">
        <Info label="Cedula" value={admission.cedula ?? "Sin dato"} />
        <Info label="Edad" value={admission.edad === null ? "Sin dato" : String(admission.edad)} />
        <Info label="Sexo" value={admission.sexo ?? "Sin dato"} />
        <Info label="Procedencia" value={admission.procedencia ?? "Sin dato"} />
        <Info label="Servicio" value={admission.servicio_requerido} />
      </div>
    </article>
  );
}

function admissionToMatchSummary(admission: EmergencyAdmission): SimilarMatchSummary {
  return {
    id: admission.id,
    nombres: admission.nombres,
    apellidos: admission.apellidos,
    cedula: admission.cedula,
    edad: admission.edad,
    sexo: admission.sexo,
    procedencia: admission.procedencia,
    hospital_nombre: admission.hospitales?.nombre ?? null,
    hospital_ciudad: admission.hospitales?.ciudad ?? null,
    fecha_ingreso: admission.fecha_ingreso,
    estado: admission.estado,
    servicio_requerido: admission.servicio_requerido,
    score: 0,
    reasons: [],
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--brand-border)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-muted)]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClassName(status)}`}>
      {status}
    </span>
  );
}

function getStatusClassName(status: string) {
  switch (status) {
    case "Fallecido":
      return "border-red-200 bg-red-50 text-red-700";
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

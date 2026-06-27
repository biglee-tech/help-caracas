"use client";

import { formatAdmissionDate } from "@/lib/dates";
import type { SimilarMatchSummary } from "@/lib/types";

type SimilarMatchesPanelProps = {
  matches: SimilarMatchSummary[];
  mode: "live" | "confirm";
  selectedId?: number;
  onSelect?: (id: number) => void;
};

export function SimilarMatchesPanel({
  matches,
  mode,
  selectedId,
  onSelect,
}: SimilarMatchesPanelProps) {
  if (matches.length === 0) {
    return null;
  }

  const isConfirm = mode === "confirm";

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        isConfirm
          ? "border-amber-300 bg-amber-50"
          : "border-amber-200 bg-amber-50/80"
      }`}
      role="status"
    >
      <p className="text-sm font-black text-amber-950">
        {isConfirm
          ? "Revisa si ya esta registrada esta persona"
          : "Posible persona ya registrada"}
      </p>
      <p className="mt-1 text-sm leading-6 text-amber-900">
        {isConfirm
          ? "Si tenes mas datos (cedula, edad, procedencia), selecciona el registro y usa Completar registro existente. Solo se llenan campos vacios."
          : "Hay ingresos similares en las ultimas horas. Revisa antes de guardar."}
      </p>

      <ul className="mt-4 space-y-3">
        {matches.map((match) => (
          <li
            className="rounded-2xl border border-amber-200 bg-white px-4 py-3"
            key={match.id}
          >
            {isConfirm && onSelect ? (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  checked={selectedId === match.id}
                  className="mt-1 h-4 w-4 accent-[var(--brand-primary)]"
                  name="selected_similar_match"
                  onChange={() => onSelect(match.id)}
                  type="radio"
                />
                <SimilarMatchDetails match={match} />
              </label>
            ) : (
              <SimilarMatchDetails match={match} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimilarMatchDetails({ match }: { match: SimilarMatchSummary }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-[var(--foreground)]">
        {match.nombres} {match.apellidos}
        <span className="ml-2 text-xs font-semibold text-[var(--brand-muted)]">
          #{match.id}
        </span>
      </p>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">
        {match.hospital_nombre ?? "Hospital no disponible"}
        {match.hospital_ciudad ? ` - ${match.hospital_ciudad}` : ""}
      </p>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">
        {formatAdmissionDate(match.fecha_ingreso)} · {match.estado ?? "Pendiente"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--brand-muted)]">
        <span>Cedula: {match.cedula ?? "Sin dato"}</span>
        <span>Edad: {match.edad ?? "Sin dato"}</span>
        <span>Sexo: {match.sexo}</span>
        {match.procedencia ? <span>Procedencia: {match.procedencia}</span> : null}
      </div>
      {match.reasons.length > 0 ? (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Coincidencias: {match.reasons.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

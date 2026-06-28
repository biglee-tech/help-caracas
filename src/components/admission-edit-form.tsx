"use client";

import { useActionState, useEffect, useState } from "react";

import { editAdmission } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import type { EditAdmissionState, SimilarMatchSummary } from "@/lib/types";
import { admissionStatuses, sexOptions } from "@/lib/validation";

const initialState: EditAdmissionState = { ok: false, message: "" };

type AdmissionEditFormProps = {
  match: SimilarMatchSummary;
  onCancel: () => void;
  onSuccess: (message: string) => void;
};

export function AdmissionEditForm({ match, onCancel, onSuccess }: AdmissionEditFormProps) {
  const [state, formAction] = useActionState(editAdmission, initialState);
  const [estado, setEstado] = useState(match.estado ?? "Pendiente");
  const isFallecido = estado === "Fallecido";

  useEffect(() => {
    if (state.ok) {
      onSuccess(state.message);
    }
  }, [state.ok, state.message, onSuccess]);

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
      <p className="text-sm font-black text-sky-950">
        Editando registro #{match.id} — {match.nombres} {match.apellidos}
      </p>
      <p className="mt-1 text-sm text-sky-800">
        Modifica los datos del registro existente. Los nombres y el hospital no se pueden cambiar desde aqui.
      </p>

      {state.message && !state.ok ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="mt-4 space-y-4">
        <input name="id" type="hidden" value={match.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            defaultValue={match.cedula ?? ""}
            error={state.fieldErrors?.cedula}
            label="Cedula"
            name="cedula"
            placeholder="Ej. V-12345678"
          />
          <Field
            defaultValue={match.edad !== null ? String(match.edad) : ""}
            error={state.fieldErrors?.edad}
            label="Edad"
            name="edad"
            placeholder="Ej. 35"
            type="number"
          />
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-bold text-[var(--foreground)]">Sexo</span>
            <select
              className={inputClass}
              defaultValue={match.sexo}
              name="sexo"
            >
              {sexOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {state.fieldErrors?.sexo ? (
              <span className="text-xs font-medium text-rose-700">{state.fieldErrors.sexo}</span>
            ) : null}
          </label>
          <Field
            defaultValue={match.procedencia ?? ""}
            error={state.fieldErrors?.procedencia}
            label="Procedencia"
            name="procedencia"
            placeholder="Sector, municipio o refugio"
          />
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-bold text-[var(--foreground)]">Estado</span>
            <select
              className={inputClass}
              name="estado"
              onChange={(e) => setEstado(e.target.value)}
              value={estado}
            >
              {admissionStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {state.fieldErrors?.estado ? (
              <span className="text-xs font-medium text-rose-700">{state.fieldErrors.estado}</span>
            ) : null}
          </label>
        </div>

        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-bold text-[var(--foreground)]">Servicio requerido</span>
          <textarea
            className="min-h-24 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            defaultValue={isFallecido ? "" : match.servicio_requerido}
            disabled={isFallecido}
            name={isFallecido ? undefined : "servicio_requerido"}
            placeholder={isFallecido ? "No aplica" : "Ej. Traumatologia, cirugia, evaluacion respiratoria"}
          />
          {isFallecido ? (
            <input name="servicio_requerido" type="hidden" value="N/A" />
          ) : null}
          {state.fieldErrors?.servicio_requerido ? (
            <span className="text-xs font-medium text-rose-700">
              {state.fieldErrors.servicio_requerido}
            </span>
          ) : null}
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <SubmitButton
            className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)]"
            pendingText="Guardando cambios..."
          >
            Guardar cambios
          </SubmitButton>
          <button
            className="rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-3 font-bold text-[var(--foreground)] transition hover:bg-[var(--background)]"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]";

type FieldProps = {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
  error?: string | null;
  type?: "text" | "number";
};

function Field({ label, name, placeholder, defaultValue, error, type = "text" }: FieldProps) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-sm font-bold text-[var(--foreground)]">{label}</span>
      <input
        className={inputClass}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
      {error ? <span className="text-xs font-medium text-rose-700">{error}</span> : null}
    </label>
  );
}

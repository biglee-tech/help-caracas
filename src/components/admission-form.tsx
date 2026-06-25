"use client";

import { useActionState, useEffect, useRef } from "react";

import { createAdmission } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import type { AdmissionActionState, Hospital } from "@/lib/types";
import { admissionStatuses } from "@/lib/validation";

const initialState: AdmissionActionState = {
  ok: false,
  message: "",
};

type AdmissionFormProps = {
  hospitals: Hospital[];
};

export function AdmissionForm({ hospitals }: AdmissionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createAdmission, initialState);
  const hasHospitals = hospitals.length > 0;

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="min-w-0 max-w-full space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-accent-strong)] sm:tracking-[0.2em]">
          Nuevo registro
        </p>
        <h2 className="mt-1 text-xl font-black text-[var(--foreground)] sm:text-2xl">
          Registrar ingreso
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--brand-muted)]">
          Completa los datos esenciales del paciente y el servicio requerido.
        </p>
      </div>

      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role="status"
        >
          {state.message}
        </div>
      ) : null}

      {!hasHospitals ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aun no hay hospitales cargados. Agrega hospitales en Supabase antes
          de registrar ingresos.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field
          error={state.fieldErrors?.nombres}
          label="Nombres"
          name="nombres"
          placeholder="Ej. Maria Elena"
          required
        />
        <Field
          error={state.fieldErrors?.apellidos}
          label="Apellidos"
          name="apellidos"
          placeholder="Ej. Perez Diaz"
          required
        />
        <Field
          error={state.fieldErrors?.cedula}
          label="Cedula"
          name="cedula"
          placeholder="Ej. V-12345678"
        />
        <Field
          error={state.fieldErrors?.procedencia}
          label="Procedencia"
          name="procedencia"
          placeholder="Sector, municipio o refugio"
        />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-bold text-[var(--foreground)]">
            Hospital
          </span>
          <select
            className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
            disabled={!hasHospitals}
            name="hospital_id"
            required
          >
            <option value="">Selecciona un hospital</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.nombre}
                {hospital.ciudad ? ` - ${hospital.ciudad}` : ""}
              </option>
            ))}
          </select>
          {state.fieldErrors?.hospital_id ? (
            <span className="text-xs font-medium text-rose-700">
              {state.fieldErrors.hospital_id}
            </span>
          ) : null}
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-bold text-[var(--foreground)]">
            Estado
          </span>
          <select
            className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
            name="estado"
          >
            {admissionStatuses.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block min-w-0 space-y-2">
        <span className="text-sm font-bold text-[var(--foreground)]">
          Servicio requerido
        </span>
        <textarea
          className="min-h-28 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
          name="servicio_requerido"
          placeholder="Ej. Traumatologia, cirugia, evaluacion respiratoria"
          required
        />
        {state.fieldErrors?.servicio_requerido ? (
          <span className="text-xs font-medium text-rose-700">
            {state.fieldErrors.servicio_requerido}
          </span>
        ) : null}
      </label>

      <SubmitButton
        className="w-full rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)] sm:w-auto"
        pendingText="Guardando ingreso..."
      >
        Registrar ingreso
      </SubmitButton>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  placeholder: string;
  error?: string | null;
  required?: boolean;
};

function Field({ label, name, placeholder, error, required }: FieldProps) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-sm font-bold text-[var(--foreground)]">
        {label}
      </span>
      <input
        className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
      />
      {error ? (
        <span className="text-xs font-medium text-rose-700">{error}</span>
      ) : null}
    </label>
  );
}

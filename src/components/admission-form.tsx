"use client";

import { useActionState, useState } from "react";

import { createAdmission } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import type { AdmissionActionState, Hospital } from "@/lib/types";
import {
  CUSTOM_HOSPITAL_VALUE,
  admissionStatuses,
  sexOptions,
} from "@/lib/validation";

const initialState: AdmissionActionState = {
  ok: false,
  message: "",
};

type AdmissionFormProps = {
  hospitals: Hospital[];
};

export function AdmissionForm({ hospitals }: AdmissionFormProps) {
  const [state, formAction] = useActionState(createAdmission, initialState);

  return (
    <div className="min-w-0 max-w-full space-y-5">
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

      <AdmissionFormFields
        fieldErrors={state.ok ? undefined : state.fieldErrors}
        formAction={formAction}
        hospitals={hospitals}
        key={state.resetKey ?? 0}
      />
    </div>
  );
}

type AdmissionFormFieldsProps = {
  hospitals: Hospital[];
  formAction: React.ComponentProps<"form">["action"];
  fieldErrors?: Record<string, string | null>;
};

function AdmissionFormFields({
  hospitals,
  formAction,
  fieldErrors,
}: AdmissionFormFieldsProps) {
  const hasHospitals = hospitals.length > 0;
  const [hospitalMode, setHospitalMode] = useState<"existing" | "custom">(() =>
    hasHospitals ? "existing" : "custom",
  );
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const isCustomHospital = hospitalMode === "custom";

  return (
    <form action={formAction} className="min-w-0 max-w-full space-y-5">
      <input name="hospital_mode" type="hidden" value={hospitalMode} />

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

      {!hasHospitals ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Aun no hay centros de salud precargados. Escribe el nombre del centro de
          salud donde se atiende al paciente.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field
          error={fieldErrors?.nombres}
          label="Nombres"
          name="nombres"
          placeholder="Ej. Maria Elena"
          required
        />
        <Field
          error={fieldErrors?.apellidos}
          label="Apellidos"
          name="apellidos"
          placeholder="Ej. Perez Diaz"
          required
        />
        <Field
          error={fieldErrors?.cedula}
          label="Cedula"
          name="cedula"
          placeholder="Ej. V-12345678"
        />
        <Field
          error={fieldErrors?.edad}
          label="Edad"
          name="edad"
          placeholder="Ej. 35"
          type="number"
        />
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-bold text-[var(--foreground)]">
            Sexo
          </span>
          <select
            className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
            name="sexo"
            required
          >
            {sexOptions.map((sexo) => (
              <option key={sexo} value={sexo}>
                {sexo}
              </option>
            ))}
          </select>
          {fieldErrors?.sexo ? (
            <span className="text-xs font-medium text-rose-700">
              {fieldErrors.sexo}
            </span>
          ) : null}
        </label>
        <Field
          error={fieldErrors?.procedencia}
          label="Procedencia"
          name="procedencia"
          placeholder="Sector, municipio o refugio"
        />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-4 sm:col-span-2">
          {hasHospitals ? (
            <label className="block min-w-0 space-y-2">
              <span className="text-sm font-bold text-[var(--foreground)]">
                Centro de salud
              </span>
              <select
                className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                name="hospital_id"
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedHospitalId(value);
                  setHospitalMode(
                    value === CUSTOM_HOSPITAL_VALUE ? "custom" : "existing",
                  );
                }}
                required={!isCustomHospital}
                value={selectedHospitalId}
              >
                <option value="">Selecciona un centro de salud</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.nombre}
                    {hospital.ciudad ? ` - ${hospital.ciudad}` : ""}
                  </option>
                ))}
                <option value={CUSTOM_HOSPITAL_VALUE}>
                  Otro centro de salud (agregar manualmente)
                </option>
              </select>
              {fieldErrors?.hospital_id ? (
                <span className="text-xs font-medium text-rose-700">
                  {fieldErrors.hospital_id}
                </span>
              ) : null}
            </label>
          ) : null}

          {isCustomHospital ? (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {!hasHospitals ? (
                <input
                  name="hospital_id"
                  type="hidden"
                  value={CUSTOM_HOSPITAL_VALUE}
                />
              ) : null}
              <Field
                error={fieldErrors?.hospital_nombre}
                label="Nombre del centro de salud"
                name="hospital_nombre"
                placeholder="Ej. Hospital General de Los Teques"
                required
              />
              <Field
                error={fieldErrors?.hospital_ciudad}
                label="Ciudad (opcional)"
                name="hospital_ciudad"
                placeholder="Ej. Miranda"
              />
              {hasHospitals ? (
                <p className="sm:col-span-2 text-sm text-[var(--brand-muted)]">
                  Usa esta opcion solo si el centro de salud no aparece en la
                  lista.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

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
        {fieldErrors?.servicio_requerido ? (
          <span className="text-xs font-medium text-rose-700">
            {fieldErrors.servicio_requerido}
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
  type?: "text" | "number";
};

function Field({
  label,
  name,
  placeholder,
  error,
  required,
  type = "text",
}: FieldProps) {
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
        type={type}
      />
      {error ? (
        <span className="text-xs font-medium text-rose-700">{error}</span>
      ) : null}
    </label>
  );
}

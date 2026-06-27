"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createAdmission } from "@/app/dashboard/actions";
import { SimilarMatchesPanel } from "@/components/similar-matches-panel";
import { SubmitButton } from "@/components/submit-button";
import type {
  AdmissionActionState,
  Hospital,
  SimilarMatchSummary,
} from "@/lib/types";
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
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const displayMessage = state.ok
    ? state.message
    : showAcknowledged
      ? "Esta persona ya estaba registrada. No se creo un nuevo ingreso."
      : state.message;
  const displayOk = state.ok || showAcknowledged;

  return (
    <div className="min-w-0 max-w-full space-y-5">
      {displayMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            displayOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : state.needsConfirmation
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role="status"
        >
          {displayMessage}
        </div>
      ) : null}

      <AdmissionFormFields
        confirmationMatches={
          state.needsConfirmation && !showAcknowledged
            ? state.similarMatches
            : undefined
        }
        fieldErrors={state.ok ? undefined : state.fieldErrors}
        formAction={formAction}
        hospitals={hospitals}
        key={`${formInstanceKey}-${state.resetKey ?? 0}`}
        onDuplicateAcknowledged={() => {
          setShowAcknowledged(true);
          setFormInstanceKey((current) => current + 1);
        }}
      />
    </div>
  );
}

type AdmissionFormFieldsProps = {
  hospitals: Hospital[];
  formAction: React.ComponentProps<"form">["action"];
  fieldErrors?: Record<string, string | null>;
  confirmationMatches?: SimilarMatchSummary[];
  onDuplicateAcknowledged: () => void;
};

function AdmissionFormFields({
  hospitals,
  formAction,
  fieldErrors,
  confirmationMatches,
  onDuplicateAcknowledged,
}: AdmissionFormFieldsProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmNotDuplicateRef = useRef<HTMLInputElement>(null);
  const useExistingIdRef = useRef<HTMLInputElement>(null);
  const hasHospitals = hospitals.length > 0;
  const [selectedHospitalId, setSelectedHospitalId] = useState(
    hasHospitals ? "" : CUSTOM_HOSPITAL_VALUE,
  );
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<string>(sexOptions[0]);
  const [liveMatches, setLiveMatches] = useState<SimilarMatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [dismissedConfirmationId, setDismissedConfirmationId] = useState<
    string | null
  >(null);
  const isCustomHospital =
    !hasHospitals || selectedHospitalId === CUSTOM_HOSPITAL_VALUE;
  const confirmationBatchId =
    confirmationMatches?.map((match) => match.id).join("-") ?? "";
  const isConfirming =
    confirmationBatchId.length > 0 &&
    dismissedConfirmationId !== confirmationBatchId;
  const resolvedSelectedMatchId =
    selectedMatchId ?? confirmationMatches?.[0]?.id ?? null;

  function clearLiveMatchesIfNeeded(nextNombres: string, nextApellidos: string) {
    if (nextNombres.trim().length < 2 && nextApellidos.trim().length < 2) {
      setLiveMatches([]);
    }
  }

  useEffect(() => {
    if (isConfirming) {
      return;
    }

    const trimmedNombres = nombres.trim();
    const trimmedApellidos = apellidos.trim();

    if (trimmedNombres.length < 2 && trimmedApellidos.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      const params = new URLSearchParams({
        nombres: trimmedNombres,
        apellidos: trimmedApellidos,
        sexo,
      });

      if (cedula.trim()) {
        params.set("cedula", cedula.trim());
      }

      if (edad.trim()) {
        params.set("edad", edad.trim());
      }

      if (
        selectedHospitalId &&
        selectedHospitalId !== CUSTOM_HOSPITAL_VALUE
      ) {
        params.set("hospital_id", selectedHospitalId);
      }

      try {
        const response = await fetch(`/api/similar?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          matches: SimilarMatchSummary[];
        };

        setLiveMatches(payload.matches ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    apellidos,
    cedula,
    edad,
    isConfirming,
    nombres,
    selectedHospitalId,
    sexo,
  ]);

  function submitAnyway() {
    if (confirmNotDuplicateRef.current) {
      confirmNotDuplicateRef.current.value = "1";
    }

    if (useExistingIdRef.current) {
      useExistingIdRef.current.value = "";
    }

    formRef.current?.requestSubmit();
  }

  function submitCompleteExisting() {
    if (confirmNotDuplicateRef.current) {
      confirmNotDuplicateRef.current.value = "";
    }

    if (useExistingIdRef.current && resolvedSelectedMatchId) {
      useExistingIdRef.current.value = String(resolvedSelectedMatchId);
    }

    formRef.current?.requestSubmit();
  }

  function acknowledgeExistingRegistration() {
    setDismissedConfirmationId(confirmationBatchId);
    onDuplicateAcknowledged();
  }

  return (
    <form action={formAction} className="min-w-0 max-w-full space-y-5" ref={formRef}>
      <input name="confirm_not_duplicate" ref={confirmNotDuplicateRef} type="hidden" value="" />
      <input name="use_existing_id" ref={useExistingIdRef} type="hidden" value="" />

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
          onChange={(event) => {
            const value = event.target.value;
            setNombres(value);
            clearLiveMatchesIfNeeded(value, apellidos);
          }}
          placeholder="Ej. Maria Elena"
          required
          value={nombres}
        />
        <Field
          error={fieldErrors?.apellidos}
          label="Apellidos"
          name="apellidos"
          onChange={(event) => {
            const value = event.target.value;
            setApellidos(value);
            clearLiveMatchesIfNeeded(nombres, value);
          }}
          placeholder="Ej. Perez Diaz"
          required
          value={apellidos}
        />
        <Field
          error={fieldErrors?.cedula}
          label="Cedula"
          name="cedula"
          onChange={(event) => setCedula(event.target.value)}
          placeholder="Ej. V-12345678"
          value={cedula}
        />
        <Field
          error={fieldErrors?.edad}
          label="Edad"
          name="edad"
          onChange={(event) => setEdad(event.target.value)}
          placeholder="Ej. 35"
          type="number"
          value={edad}
        />
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-bold text-[var(--foreground)]">
            Sexo
          </span>
          <select
            className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
            name="sexo"
            onChange={(event) => setSexo(event.target.value)}
            required
            value={sexo}
          >
            {sexOptions.map((option) => (
              <option key={option} value={option}>
                {option}
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

      {!isConfirming && liveMatches.length > 0 ? (
        <SimilarMatchesPanel matches={liveMatches} mode="live" />
      ) : null}

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
                  setSelectedHospitalId(event.target.value);
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

      {isConfirming && confirmationMatches ? (
        <>
          <SimilarMatchesPanel
            matches={confirmationMatches}
            mode="confirm"
            onSelect={setSelectedMatchId}
            selectedId={resolvedSelectedMatchId ?? undefined}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)]"
              disabled={!resolvedSelectedMatchId}
              onClick={submitCompleteExisting}
              type="button"
            >
              Completar registro existente
            </button>
            <button
              className="rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-3 font-bold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              onClick={acknowledgeExistingRegistration}
              type="button"
            >
              Ya esta registrada (no crear otro)
            </button>
            <button
              className="rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-3 font-bold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              onClick={submitAnyway}
              type="button"
            >
              Registrar de todos modos
            </button>
          </div>
        </>
      ) : (
        <SubmitButton
          className="w-full rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)] sm:w-auto"
          pendingText="Guardando ingreso..."
        >
          Registrar ingreso
        </SubmitButton>
      )}
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
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function Field({
  label,
  name,
  placeholder,
  error,
  required,
  type = "text",
  value,
  onChange,
}: FieldProps) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-sm font-bold text-[var(--foreground)]">
        {label}
      </span>
      <input
        className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {error ? (
        <span className="text-xs font-medium text-rose-700">{error}</span>
      ) : null}
    </label>
  );
}

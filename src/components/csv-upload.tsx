"use client";

import { useEffect, useRef, useState } from "react";

import {
  bulkCreateAdmissions,
  type BulkImportResult,
  type CsvRowRaw,
} from "@/app/dashboard/actions";
import { parseCsv } from "@/lib/csv";
import type { Hospital } from "@/lib/types";

const KNOWN_COLUMNS = [
  "nombres",
  "apellidos",
  "cedula",
  "edad",
  "sexo",
  "procedencia",
  "servicio_requerido",
  "estado",
] as const;

const REQUIRED_COLUMNS = ["nombres", "apellidos"] as const;

function mapRows(headers: string[], rows: string[][]): CsvRowRaw[] {
  const get = (row: string[], column: string): string => {
    const index = headers.indexOf(column);
    return index !== -1 ? (row[index] ?? "").trim() : "";
  };

  return rows.map((row) => ({
    nombres: get(row, "nombres"),
    apellidos: get(row, "apellidos"),
    cedula: get(row, "cedula"),
    edad: get(row, "edad"),
    sexo: get(row, "sexo"),
    procedencia: get(row, "procedencia"),
    servicio_requerido: get(row, "servicio_requerido"),
    estado: get(row, "estado"),
  }));
}

function downloadTemplate() {
  const sample = [
    "Maria",
    "Perez Diaz",
    "V-12345678",
    "35",
    "Femenino",
    "Sector Centro, Caracas",
    "Traumatologia",
    "Pendiente",
  ];
  const content = `﻿${KNOWN_COLUMNS.join(",")}\n${sample.join(",")}\n`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "plantilla_importacion.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CsvUpload({ hospitals }: { hospitals: Hospital[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [rows, setRows] = useState<CsvRowRaw[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function getFocusable() {
      return Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function ingestFile(file: File) {
    setError(null);
    setResult(null);

    const text = await file.text();
    const { headers, rows: dataRows } = parseCsv(text);

    const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
    if (missing.length > 0) {
      setError(
        `El CSV debe incluir las columnas: ${missing.join(", ")}. ` +
          `Columnas reconocidas: ${KNOWN_COLUMNS.join(", ")}.`,
      );
      return;
    }

    if (dataRows.length === 0) {
      setError("El archivo no contiene filas con datos.");
      return;
    }

    setFileName(file.name);
    setRows(mapRows(headers, dataRows));
    setStep(2);
  }

  async function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      await ingestFile(file);
    }
    event.target.value = "";
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await ingestFile(file);
    }
  }

  async function handleImport() {
    if (!rows || !selectedHospitalId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const importResult = await bulkCreateAdmissions(rows, Number(selectedHospitalId), {
        skipDuplicates,
      });
      setResult(importResult);
    } catch {
      setError("No pudimos completar la importacion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setRows(null);
    setFileName(null);
    setSelectedHospitalId("");
    setSkipDuplicates(true);
    setResult(null);
    setError(null);
    setIsDragging(false);
  }

  function close() {
    reset();
    setOpen(false);
  }

  return (
    <>
      <button
        className="shrink-0 rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--brand-accent-strong)] transition hover:border-[var(--brand-accent-strong)] hover:bg-[var(--background)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        Cargar CSV
      </button>

      {open ? (
        <div
          aria-labelledby="csv-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
          role="dialog"
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" ref={modalRef}>
            <header className="flex items-start justify-between gap-4 border-b border-[var(--brand-border)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-strong)]">
                  Importacion masiva
                </p>
                <h2
                  className="mt-1 text-lg font-black text-[var(--foreground)] sm:text-xl"
                  id="csv-modal-title"
                >
                  Cargar registros desde CSV
                </h2>
              </div>
              <button
                aria-label="Cerrar"
                className="shrink-0 rounded-full border border-[var(--brand-border)] px-3 py-1.5 text-sm font-bold text-[var(--brand-muted)] transition hover:bg-[var(--background)]"
                onClick={close}
                ref={closeButtonRef}
                type="button"
              >
                Cerrar
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
              {result ? (
                <ImportResultView onClose={close} onReset={reset} result={result} />
              ) : (
                <div className="space-y-5">
                  <StepIndicator step={step} />

                  {step === 1 ? (
                    <UploadStep
                      error={error}
                      isDragging={isDragging}
                      onDownloadTemplate={downloadTemplate}
                      onDragLeave={() => setIsDragging(false)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDrop={handleDrop}
                      onFileInput={handleFileInput}
                    />
                  ) : null}

                  {step === 2 && rows ? (
                    <ConfirmStep
                      error={error}
                      fileName={fileName}
                      hospitals={hospitals}
                      loading={loading}
                      onBack={() => setStep(1)}
                      onHospitalChange={setSelectedHospitalId}
                      onImport={handleImport}
                      onSkipDuplicatesChange={setSkipDuplicates}
                      rows={rows}
                      selectedHospitalId={selectedHospitalId}
                      skipDuplicates={skipDuplicates}
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold">
      <StepDot active={step === 1} done={step > 1} label="Archivo" number={1} />
      <span className="h-px flex-1 bg-[var(--brand-border)]" />
      <StepDot active={step === 2} done={false} label="Confirmar" number={2} />
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
  number,
}: {
  active: boolean;
  done: boolean;
  label: string;
  number: number;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
          active || done
            ? "bg-[var(--brand-accent-strong)] text-white"
            : "bg-[var(--brand-border)] text-[var(--brand-muted)]"
        }`}
      >
        {number}
      </span>
      <span className={active ? "text-[var(--foreground)]" : "text-[var(--brand-muted)]"}>
        {label}
      </span>
    </span>
  );
}

function UploadStep({
  error,
  isDragging,
  onDownloadTemplate,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInput,
}: {
  error: string | null;
  isDragging: boolean;
  onDownloadTemplate: () => void;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--brand-muted)]">
        Sube un archivo CSV con las personas hospitalizadas. Solo{" "}
        <strong className="text-[var(--foreground)]">nombres</strong> y{" "}
        <strong className="text-[var(--foreground)]">apellidos</strong> son obligatorios;
        el resto se completa automaticamente si falta.
      </p>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? "border-[var(--brand-accent-strong)] bg-[color:rgba(102,200,198,0.10)]"
            : "border-[var(--brand-border)] bg-[var(--background)] hover:border-[var(--brand-accent-strong)]"
        }`}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <span className="text-sm font-bold text-[var(--foreground)]">
          Arrastra el CSV aqui o haz clic para elegirlo
        </span>
        <span className="text-xs text-[var(--brand-muted)]">Formato .csv (UTF-8)</span>
        <input accept=".csv,text/csv" className="hidden" onChange={onFileInput} type="file" />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--brand-muted)]">
          Columnas reconocidas: {KNOWN_COLUMNS.join(", ")}.
        </p>
        <button
          className="text-xs font-bold text-[var(--brand-accent-strong)] underline-offset-2 hover:underline"
          onClick={onDownloadTemplate}
          type="button"
        >
          Descargar plantilla
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}

function ConfirmStep({
  error,
  fileName,
  hospitals,
  loading,
  onBack,
  onHospitalChange,
  onImport,
  onSkipDuplicatesChange,
  rows,
  selectedHospitalId,
  skipDuplicates,
}: {
  error: string | null;
  fileName: string | null;
  hospitals: Hospital[];
  loading: boolean;
  onBack: () => void;
  onHospitalChange: (value: string) => void;
  onImport: () => void;
  onSkipDuplicatesChange: (value: boolean) => void;
  rows: CsvRowRaw[];
  selectedHospitalId: string;
  skipDuplicates: boolean;
}) {
  const previewRows = rows.slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--background)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {rows.length} {rows.length === 1 ? "fila detectada" : "filas detectadas"}
          {fileName ? <span className="text-[var(--brand-muted)]"> · {fileName}</span> : null}
        </p>
        <button
          className="text-xs font-bold text-[var(--brand-accent-strong)] underline-offset-2 hover:underline"
          onClick={onBack}
          type="button"
        >
          Cambiar archivo
        </button>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-[var(--foreground)]">
          Centro de salud de estos registros
        </span>
        <select
          className="min-h-12 w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
          onChange={(event) => onHospitalChange(event.target.value)}
          value={selectedHospitalId}
        >
          <option value="">Selecciona un centro de salud</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.nombre}
              {hospital.ciudad ? ` - ${hospital.ciudad}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3">
        <input
          checked={skipDuplicates}
          className="mt-0.5 h-4 w-4 accent-[var(--brand-primary)]"
          onChange={(event) => onSkipDuplicatesChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm text-[var(--foreground)]">
          <span className="font-bold">Saltar posibles duplicados</span>
          <span className="mt-0.5 block text-xs text-[var(--brand-muted)]">
            Omite filas cuya cedula ya existe en el sistema o se repite dentro del archivo.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-muted)]">
          Vista previa
        </p>
        <div className="overflow-auto rounded-2xl border border-[var(--brand-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--background)] text-[var(--brand-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Nombres</th>
                <th className="px-3 py-2 font-semibold">Apellidos</th>
                <th className="px-3 py-2 font-semibold">Cedula</th>
                <th className="px-3 py-2 font-semibold">Edad</th>
                <th className="px-3 py-2 font-semibold">Sexo</th>
                <th className="px-3 py-2 font-semibold">Procedencia</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr className="border-t border-[var(--brand-border)]" key={index}>
                  <td className="px-3 py-1.5">{row.nombres}</td>
                  <td className="px-3 py-1.5">{row.apellidos}</td>
                  <td className="px-3 py-1.5">{row.cedula}</td>
                  <td className="px-3 py-1.5">{row.edad}</td>
                  <td className="px-3 py-1.5">{row.sexo}</td>
                  <td className="px-3 py-1.5">{row.procedencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > previewRows.length ? (
          <p className="text-xs text-[var(--brand-muted)]">
            Mostrando {previewRows.length} de {rows.length} filas.
          </p>
        ) : null}
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)]"
          disabled={loading || !selectedHospitalId}
          onClick={onImport}
          type="button"
        >
          {loading ? "Importando..." : `Importar ${rows.length} registros`}
        </button>
        {!selectedHospitalId ? (
          <p className="text-xs text-[var(--brand-muted)]">
            Selecciona un centro de salud para continuar.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ImportResultView({
  onClose,
  onReset,
  result,
}: {
  onClose: () => void;
  onReset: () => void;
  result: BulkImportResult;
}) {
  const hasFailures = result.failed.length > 0;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
          hasFailures
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
      >
        Se importaron <strong>{result.imported}</strong> registros.
        {result.skipped > 0 ? <> {result.skipped} se saltaron por duplicados.</> : null}
        {hasFailures ? <> {result.failed.length} no se pudieron importar.</> : null}
      </div>

      {hasFailures ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-muted)]">
            Filas con problemas
          </p>
          <div className="max-h-48 overflow-auto rounded-2xl border border-[var(--brand-border)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--background)] text-[var(--brand-muted)]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fila</th>
                  <th className="px-3 py-2 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {result.failed.map((failure) => (
                  <tr className="border-t border-[var(--brand-border)]" key={failure.row}>
                    <td className="px-3 py-1.5 font-semibold">{failure.row}</td>
                    <td className="px-3 py-1.5">{failure.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="rounded-2xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-dark)]"
          onClick={onClose}
          type="button"
        >
          Listo
        </button>
        <button
          className="rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--background)]"
          onClick={onReset}
          type="button"
        >
          Importar otro archivo
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
      {message}
    </div>
  );
}

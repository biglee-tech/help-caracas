"use client";

import { useState } from "react";
import type { CsvRow } from "@/app/dashboard/actions";
import { bulkCreateAdmissions } from "@/app/dashboard/actions";
import type { Hospital } from "@/lib/types";

const EXPECTED_HEADERS = [
  "nombres",
  "apellidos",
  "edad",
  "sexo",
  "cedula",
  "procedencia",
  "servicio_requerido",
  "hospital_id",
  "fecha_ingreso",
  "estado",
];

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function rowsToData(headers: string[], rows: string[][], hospitalId: number): CsvRow[] {
  const getValue = (row: string[], col: string): string => {
    const idx = headers.indexOf(col);
    return idx !== -1 ? (row[idx] ?? "") : "";
  };

  return rows.map((row) => ({
    nombres: getValue(row, "nombres"),
    apellidos: getValue(row, "apellidos"),
    edad: getValue(row, "edad") ? Number(getValue(row, "edad")) : undefined,
    sexo: getValue(row, "sexo"),
    cedula: getValue(row, "cedula") || undefined,
    procedencia: getValue(row, "procedencia") || undefined,
    servicio_requerido: getValue(row, "servicio_requerido"),
    hospital_id: hospitalId,
    fecha_ingreso: getValue(row, "fecha_ingreso") || undefined,
    estado: getValue(row, "estado") || undefined,
  }));
}

function downloadTemplate() {
  const headerRow = EXPECTED_HEADERS.join(",");
  const sampleRow = [
    "Maria", "Perez", "35", "Femenino", "V-12345678",
    "Sector Centro", "Traumatologia", "", "2025-06-27 14:30", "Pendiente",
  ].join(",");
  const bom = "\uFEFF";
  const blob = new Blob([bom + headerRow + "\n" + sampleRow + "\n"], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_importacion.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvUpload({ hospitals }: { hospitals: Hospital[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [rawRows, setRawRows] = useState<string[][] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[] | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [preview, setPreview] = useState<CsvRow[] | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResult(null);
    setValidationError(null);

    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    const headerMatch = EXPECTED_HEADERS.every((h) => headers.includes(h));
    if (!headerMatch) {
      const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
      setValidationError(
        `Faltan columnas en el CSV: ${missing.join(", ")}. Las columnas deben ser: ${EXPECTED_HEADERS.join(", ")}`,
      );
      return;
    }

    if (rows.length === 0) {
      setValidationError("El archivo CSV no contiene datos.");
      return;
    }

    setCsvHeaders(headers);
    setRawRows(rows);
    setStep(2);
  }

  async function handleImport() {
    if (!preview || preview.length === 0) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await bulkCreateAdmissions(preview);
      setResult({ imported: res.imported, errors: res.errors });
      setPreview(null);
    } catch {
      setValidationError("Error al importar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleHospitalChange(value: string) {
    setSelectedHospitalId(value);
    setValidationError(null);

    if (value && csvHeaders && rawRows) {
      setPreview(rowsToData(csvHeaders, rawRows, Number(value)));
    } else {
      setPreview(null);
    }
  }

  function reset() {
    setStep(1);
    setRawRows(null);
    setCsvHeaders(null);
    setPreview(null);
    setResult(null);
    setValidationError(null);
    setSelectedHospitalId("");
  }

  function close() {
    reset();
    setOpen(false);
  }

  return (
    <>
      <button
        className="shrink-0 rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--brand-accent-strong)] transition hover:bg-[var(--background)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        Cargar CSV
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="w-[80%] max-h-[85vh] overflow-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-strong)]">
                  Importacion masiva
                </p>
                <h2 className="mt-1 text-xl font-black text-[var(--foreground)] sm:text-2xl">
                  Cargar registros desde CSV
                </h2>
              </div>
              <button
                className="shrink-0 rounded-2xl border border-[var(--brand-border)] px-4 py-2 text-sm font-bold text-[var(--brand-muted)] transition hover:bg-[var(--background)]"
                onClick={close}
                type="button"
              >
                Cerrar
              </button>
            </div>

            {!result ? (
              <div className="mt-6 space-y-6">
                {step === 1 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-accent-strong)] text-xs font-black text-white">
                        1
                      </span>
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        Cargar archivo CSV
                      </span>
                    </div>

                    <p className="text-xs text-[var(--brand-muted)]">
                      Columnas requeridas: {EXPECTED_HEADERS.join(", ")}
                    </p>

                    <button
                      className="text-xs font-semibold text-[var(--brand-accent-strong)] underline-offset-2 hover:underline"
                      onClick={downloadTemplate}
                      type="button"
                    >
                      Descargar plantilla CSV
                    </button>

                    <input
                      accept=".csv"
                      className="block w-full text-sm text-[var(--foreground)] file:mr-3 file:cursor-pointer file:rounded-2xl file:border-0 file:bg-[var(--brand-primary)] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white file:transition hover:file:bg-[var(--brand-primary-dark)]"
                      onChange={handleFile}
                      type="file"
                    />

                    {validationError ? (
                      <p className="text-sm font-medium text-rose-700">{validationError}</p>
                    ) : null}
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-accent-strong)] text-xs font-black text-white">
                        2
                      </span>
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        Centro de salud y confirmacion
                      </span>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-[var(--foreground)]">
                        Centro de salud
                      </label>
                      <select
                        className="mt-1.5 min-h-12 w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
                        onChange={(e) => handleHospitalChange(e.target.value)}
                        value={selectedHospitalId}
                      >
                        <option value="">Selecciona un centro de salud</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nombre}{h.ciudad ? ` - ${h.ciudad}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                        onClick={() => setStep(1)}
                        type="button"
                      >
                        Volver al paso 1
                      </button>
                      <button
                        className="text-xs font-semibold text-[var(--brand-accent-strong)] underline-offset-2 hover:underline"
                        onClick={downloadTemplate}
                        type="button"
                      >
                        Descargar plantilla CSV
                      </button>
                    </div>

                    {validationError ? (
                      <p className="text-sm font-medium text-rose-700">{validationError}</p>
                    ) : null}

                    {preview && preview.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {preview.length} registros listos para importar
                        </p>
                        <div className="max-h-48 overflow-auto rounded-xl border border-[var(--brand-border)]">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-[var(--brand-border)]/30 text-[var(--brand-muted)]">
                                <th className="px-3 py-2 font-semibold">nombres</th>
                                <th className="px-3 py-2 font-semibold">apellidos</th>
                                <th className="px-3 py-2 font-semibold">edad</th>
                                <th className="px-3 py-2 font-semibold">sexo</th>
                                <th className="px-3 py-2 font-semibold">cedula</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.slice(0, 10).map((row, i) => (
                                <tr key={i} className="border-t border-[var(--brand-border)]/50">
                                  <td className="px-3 py-1.5">{row.nombres}</td>
                                  <td className="px-3 py-1.5">{row.apellidos}</td>
                                  <td className="px-3 py-1.5">{row.edad ?? ""}</td>
                                  <td className="px-3 py-1.5">{row.sexo}</td>
                                  <td className="px-3 py-1.5">{row.cedula ?? ""}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {preview.length > 10 ? (
                          <p className="text-xs text-[var(--brand-muted)]">
                            Mostrando 10 de {preview.length} registros
                          </p>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            className="rounded-2xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={loading}
                            onClick={handleImport}
                            type="button"
                          >
                            {loading ? "Importando..." : `Importar ${preview.length} registros`}
                          </button>
                          <button
                            className="rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                            disabled={loading}
                            onClick={reset}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--brand-muted)]">
                        Selecciona un centro de salud para ver la vista previa.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6">
                <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  result.errors === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-300 bg-amber-50 text-amber-900"
                }`}>
                  {result.errors === 0
                    ? `Se importaron ${result.imported} registros correctamente.`
                    : `Importacion completada: ${result.imported} exitosos, ${result.errors} errores.`}
                </div>
                <button
                  className="mt-4 rounded-2xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-primary-dark)]"
                  onClick={close}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

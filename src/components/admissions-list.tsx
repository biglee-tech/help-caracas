import { AdmissionCard } from "@/components/admission-card";
import type { EmergencyAdmission } from "@/lib/types";

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
        <AdmissionCard admission={admission} key={admission.id} />
      ))}
    </div>
  );
}


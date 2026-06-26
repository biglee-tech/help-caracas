import { formatDisplayName } from "@/lib/person-normalize";
import type { AdmissionInput } from "@/lib/validation";

export function normalizeAdmissionNames(input: AdmissionInput): {
  nombres: string;
  apellidos: string;
} {
  return {
    nombres: formatDisplayName(input.nombres),
    apellidos: formatDisplayName(input.apellidos),
  };
}

import { z } from "zod";

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(160, `${label} es demasiado largo`);

const optionalText = z
  .string()
  .trim()
  .max(160, "El texto es demasiado largo")
  .optional()
  .transform((value) => (value ? value : null));

export const admissionStatuses = [
  "Pendiente",
  "En atencion",
  "Referido",
  "Atendido",
] as const;

export const admissionStatusSchema = z.enum(admissionStatuses);

export const admissionSchema = z.object({
  nombres: requiredText("Nombres"),
  apellidos: requiredText("Apellidos"),
  cedula: optionalText,
  procedencia: optionalText,
  hospital_id: z.coerce
    .number({ error: "Selecciona un hospital" })
    .int("Selecciona un hospital valido")
    .positive("Selecciona un hospital"),
  servicio_requerido: requiredText("Servicio requerido"),
  estado: admissionStatusSchema.optional().default("Pendiente"),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;

export function formDataToAdmissionInput(formData: FormData) {
  return {
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula"),
    procedencia: formData.get("procedencia"),
    hospital_id: formData.get("hospital_id"),
    servicio_requerido: formData.get("servicio_requerido"),
    estado: formData.get("estado"),
  };
}

export function getFieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((fieldErrors, issue) => {
    const field = String(issue.path[0] ?? "");

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }

    return fieldErrors;
  }, {});
}

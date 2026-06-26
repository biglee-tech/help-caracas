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

const optionalAge = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce
    .number({ error: "La edad debe ser un numero" })
    .int("La edad debe ser un numero entero")
    .min(0, "La edad no puede ser negativa")
    .max(130, "La edad no parece valida")
    .optional(),
);

export const CUSTOM_HOSPITAL_VALUE = "__custom__" as const;

export const hospitalModes = ["existing", "custom"] as const;

export const admissionStatuses = [
  "Pendiente",
  "En atencion",
  "Referido",
  "Atendido",
] as const;

export const admissionStatusSchema = z.enum(admissionStatuses);

export const sexOptions = [
  "Masculino",
  "Femenino",
  "No especificado",
] as const;

export const sexSchema = z.enum(sexOptions);

const optionalHospitalId = z.preprocess(
  (value) =>
    value === "" || value === null || value === CUSTOM_HOSPITAL_VALUE
      ? undefined
      : value,
  z.coerce
    .number({ error: "Selecciona un hospital valido" })
    .int("Selecciona un hospital valido")
    .positive("Selecciona un hospital valido")
    .optional(),
);

export const admissionSchema = z
  .object({
    nombres: requiredText("Nombres"),
    apellidos: requiredText("Apellidos"),
    cedula: optionalText,
    edad: optionalAge,
    sexo: sexSchema,
    procedencia: optionalText,
    hospital_mode: z.enum(hospitalModes).default("existing"),
    hospital_id: optionalHospitalId,
    hospital_nombre: optionalText,
    hospital_ciudad: optionalText,
    servicio_requerido: requiredText("Servicio requerido"),
    estado: admissionStatusSchema.optional().default("Pendiente"),
  })
  .superRefine((data, ctx) => {
    if (data.hospital_mode === "existing" && !data.hospital_id) {
      ctx.addIssue({
        code: "custom",
        message: "Selecciona un hospital",
        path: ["hospital_id"],
      });
    }

    if (data.hospital_mode === "custom") {
      const nombre = data.hospital_nombre?.trim() ?? "";

      if (nombre.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Nombre del hospital es obligatorio (minimo 3 caracteres)",
          path: ["hospital_nombre"],
        });
      }
    }
  });

export type AdmissionInput = z.infer<typeof admissionSchema>;

export function normalizeHospitalName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function formDataToAdmissionInput(formData: FormData) {
  const hospitalId = formData.get("hospital_id");
  const hospitalMode = formData.get("hospital_mode");

  return {
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula"),
    edad: formData.get("edad"),
    sexo: formData.get("sexo"),
    procedencia: formData.get("procedencia"),
    hospital_mode:
      hospitalMode === "custom" || hospitalId === CUSTOM_HOSPITAL_VALUE
        ? "custom"
        : "existing",
    hospital_id: hospitalId,
    hospital_nombre: formData.get("hospital_nombre"),
    hospital_ciudad: formData.get("hospital_ciudad"),
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

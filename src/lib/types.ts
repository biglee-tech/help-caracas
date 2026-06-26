export type Hospital = {
  id: number;
  nombre: string;
  ciudad: string | null;
};

export type EmergencyAdmission = {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  edad: number | null;
  sexo: string;
  procedencia: string | null;
  hospital_id: number;
  fecha_ingreso: string;
  servicio_requerido: string;
  estado: string | null;
  created_at: string;
  hospitales: Hospital | null;
};

export type AdmissionActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string | null>;
};

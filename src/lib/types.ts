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

export type SimilarityInput = {
  nombres: string;
  apellidos: string;
  cedula?: string | null;
  edad?: number | null;
  sexo?: string;
  hospital_id?: number;
};

export type SimilarMatch = {
  admission: EmergencyAdmission;
  score: number;
  reasons: string[];
};

export type SimilarMatchSummary = {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  edad: number | null;
  sexo: string;
  procedencia: string | null;
  hospital_nombre: string | null;
  hospital_ciudad: string | null;
  fecha_ingreso: string;
  estado: string | null;
  servicio_requerido: string;
  score: number;
  reasons: string[];
};

export type AdmissionActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string | null>;
  resetKey?: number;
  needsConfirmation?: boolean;
  similarMatches?: SimilarMatchSummary[];
};

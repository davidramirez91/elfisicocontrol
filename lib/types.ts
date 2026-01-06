export type PlanInfo = {
  price: number;
  hours: number;
  label: string;
};

export type PlansMap = Record<string, PlanInfo>;

export type Client = {
  id: number;
  name: string;
  dni: string | null;
  representative: string | null;
  representative_dni: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  plan: string;
  abono: number;      // tu backend ya lo normaliza a number
  hours: number;
  created_date: string;
  planInfo: PlanInfo | null;
};

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; details?: unknown };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

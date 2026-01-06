import { z } from "zod";
import { PLAN_KEYS } from "./plans";

const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const zTextOpt = z.preprocess(trim, z.string().min(1).optional());

const zMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
  z.number().finite().min(0)
);

const zIntNonNeg = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
  z.number().int().min(0)
);

export const createClientSchema = z.object({
  name: z.preprocess(trim, z.string().min(1, "Nombre es requerido")),
  dni: zTextOpt,
  representative: zTextOpt,
  representative_dni: zTextOpt,
  email: z.preprocess(trim, z.string().email().optional()),
  address: zTextOpt,
  phone: zTextOpt,
  plan: z.enum(PLAN_KEYS),
  abono: zMoney.optional().default(0),
  hours: zIntNonNeg.optional().default(0)
});

export const updateClientSchema = z.object({
  name: z.preprocess(trim, z.string().min(1).optional()),
  dni: zTextOpt,
  representative: zTextOpt,
  representative_dni: zTextOpt,
  email: z.preprocess(trim, z.string().email().optional()),
  address: zTextOpt,
  phone: zTextOpt,
  plan: z.enum(PLAN_KEYS).optional(),
  abono: zMoney.optional()
  // hours NO se actualiza aquí: se maneja en /hours
});

export const incHoursSchema = z.object({
  delta: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 1 : Number(v)),
    z.number().int().min(1).max(24) // seguridad: por click no deberías sumar 999
  )
});

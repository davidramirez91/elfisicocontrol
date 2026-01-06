import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getPlanInfo, PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientRow = {
  id: number;
  name: string;
  dni: string | null;
  representative: string | null;
  representative_dni: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  plan: string;
  abono: string; // NUMERIC llega como string
  hours: number;
  created_date: string; // DATE como string
};

function normalizeClient(row: ClientRow) {
  return {
    ...row,
    abono: Number(row.abono ?? 0),
    planInfo: getPlanInfo(row.plan),
  };
}


function isValidPlan(plan: unknown): plan is string {
  return typeof plan === "string" && Object.prototype.hasOwnProperty.call(PLANS, plan);
}

function toOptionalText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function toNonNegNumber(v: unknown, fallback = 0): number {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function toNonNegInt(v: unknown, fallback = 0): number {
  const n = toNonNegNumber(v, fallback);
  const i = Math.trunc(n);
  return i < 0 ? fallback : i;
}

export async function GET() {
  const res = await pool.query<ClientRow>(`SELECT * FROM public.clients ORDER BY id ASC`);
  return NextResponse.json({ ok: true, data: res.rows.map(normalizeClient) });
}

export async function POST(req: Request) {

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ ok: false, error: "Nombre es requerido" }, { status: 400 });
  }

  if (!isValidPlan(body.plan)) {
    return NextResponse.json({ ok: false, error: "Plan inválido" }, { status: 400 });
  }

  const dni = toOptionalText(body.dni);
  const representative = toOptionalText(body.representative);
  const representative_dni = toOptionalText(body.representative_dni);
  const email = toOptionalText(body.email);
  const address = toOptionalText(body.address);
  const phone = toOptionalText(body.phone);

  const abono = toNonNegNumber(body.abono, 0);
  const hours = toNonNegInt(body.hours, 0);

  const { rows } = await pool.query<ClientRow>(
    `
    INSERT INTO public.clients
      (name, dni, representative, representative_dni, email, address, phone, plan, abono, hours)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
    `,
    [
      name,
      dni,
      representative,
      representative_dni,
      email,
      address,
      phone,
      body.plan,
      abono,
      hours,
    ]
  );

  return NextResponse.json(
    { ok: true, data: normalizeClient(rows[0]) },
    { status: 201 }
  );
}

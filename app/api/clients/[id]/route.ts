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
  abono: string;
  hours: number;
  created_date: string;
};

function normalizeClient(row: ClientRow) {
  return {
    ...row,
    abono: Number(row.abono ?? 0),
    planInfo: getPlanInfo(row.plan),
  };
}

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isValidPlan(plan: unknown): plan is string {
  return typeof plan === "string" && Object.prototype.hasOwnProperty.call(PLANS, plan);
}

function toOptionalText(v: unknown): string | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null as any; // para permitir null explícito si quieres
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : null as any;
}

function toNonNegNumber(v: unknown): number | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function parseNonNegInt(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const res = await pool.query<ClientRow>(`SELECT * FROM public.clients WHERE id = $1`, [id]);
  if (res.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: normalizeClient(res.rows[0]) });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const fields: Array<{ col: string; val: unknown }> = [];

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ ok: false, error: "Nombre no puede estar vacío" }, { status: 400 });
    fields.push({ col: "name", val: name });
  }

  const dni = toOptionalText(body.dni);
  if (dni !== undefined) fields.push({ col: "dni", val: dni });

  const representative = toOptionalText(body.representative);
  if (representative !== undefined) fields.push({ col: "representative", val: representative });

  const representative_dni = toOptionalText(body.representative_dni);
  if (representative_dni !== undefined) fields.push({ col: "representative_dni", val: representative_dni });

  const email = toOptionalText(body.email);
  if (email !== undefined) fields.push({ col: "email", val: email });

  const address = toOptionalText(body.address);
  if (address !== undefined) fields.push({ col: "address", val: address });

  const phone = toOptionalText(body.phone);
  if (phone !== undefined) fields.push({ col: "phone", val: phone });

  if (body.plan !== undefined) {
    if (!isValidPlan(body.plan)) {
      return NextResponse.json({ ok: false, error: "Plan inválido" }, { status: 400 });
    }
    fields.push({ col: "plan", val: body.plan });
  }

  const abono = toNonNegNumber(body.abono);
  if (abono !== undefined) fields.push({ col: "abono", val: abono });


  // ✅ NUEVO: permitir actualizar horas en PUT (renovar)
  if (body.hours !== undefined) {
    const h = body.hours === "" || body.hours === null ? 0 : parseNonNegInt(body.hours);
    if (h === null) return NextResponse.json({ ok: false, error: "hours inválidas" }, { status: 400 });
    fields.push({ col: "hours", val: h });
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const f of fields) {
    sets.push(`${f.col} = $${i++}`);
    values.push(f.val);
  }
  values.push(id);

  const res = await pool.query<ClientRow>(
    `UPDATE public.clients SET ${sets.join(", ")} WHERE id = $${i} RETURNING *;`,
    values
  );

  if (res.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: normalizeClient(res.rows[0]) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const res = await pool.query<ClientRow>(
    `DELETE FROM public.clients WHERE id = $1 RETURNING *;`,
    [id]
  );

  if (res.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: normalizeClient(res.rows[0]) });
}

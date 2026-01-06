import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getPlanInfo } from "@/lib/plans";

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

async function safeJson(req: Request): Promise<any | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function parseDelta(v: unknown) {
  if (v === undefined || v === null || v === "") return 1;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 24) return null; // seguridad
  return n;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const body = (await safeJson(req)) ?? {};
  const delta = parseDelta(body.delta);
  if (delta === null) {
    return NextResponse.json(
      { ok: false, error: "delta inválido (int entre 1 y 24)" },
      { status: 400 }
    );
  }

  const res = await pool.query<ClientRow>(
    `
    UPDATE public.clients
    SET hours = hours + $1
    WHERE id = $2
    RETURNING *;
    `,
    [delta, id]
  );

  if (res.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: normalizeClient(res.rows[0]) });
}

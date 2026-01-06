import { NextResponse } from "next/server";
import { PLANS } from "../../../lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, data: PLANS });
}

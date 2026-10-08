import { NextResponse } from "next/server";
import { getData } from "@/lib/tickets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
  const streets = getData().streets;
  const rows = q ? streets.filter((x) => x.street.toLowerCase().includes(q)) : streets;
  return NextResponse.json({ count: rows.length, streets: rows.slice(0, limit) });
}

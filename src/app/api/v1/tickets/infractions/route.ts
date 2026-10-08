import { NextResponse } from "next/server";
import { getData } from "@/lib/tickets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const q = (searchParams.get("q") || "").toLowerCase();
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "60", 10) || 60));
  const book = getData().codebook;
  if (code) {
    const c = book.find((x) => x.code === code);
    if (!c) return NextResponse.json({ error: "unknown infraction code" }, { status: 404 });
    return NextResponse.json(c);
  }
  const rows = q ? book.filter((x) => x.desc.toLowerCase().includes(q) || x.code === q) : book;
  return NextResponse.json({ count: rows.length, infractions: rows.slice(0, limit) });
}

import { NextResponse } from "next/server";
import { getData } from "@/lib/tickets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const hoods = getData().hoods;
  if (code) {
    const h = hoods.find((x) => x.code === code);
    if (!h) return NextResponse.json({ error: "unknown neighbourhood code" }, { status: 404 });
    return NextResponse.json(h);
  }
  return NextResponse.json({ count: hoods.length, neighbourhoods: hoods });
}

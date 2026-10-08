import { NextResponse } from "next/server";
import { getData } from "@/lib/tickets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  if (!q) return NextResponse.json({ streets: [], wards: [], neighbourhoods: [], infractions: [] });
  const d = getData();
  return NextResponse.json({
    streets: d.streets.filter((x) => x.street.toLowerCase().includes(q)).slice(0, 8),
    wards: d.wards.filter((x) => x.name.toLowerCase().includes(q) || x.ward === q).slice(0, 5),
    neighbourhoods: d.hoods.filter((x) => x.name.toLowerCase().includes(q) || x.code === q).slice(0, 8),
    infractions: d.codebook.filter((x) => x.desc.toLowerCase().includes(q) || x.code === q).slice(0, 8),
  });
}

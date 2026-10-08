import { NextResponse } from "next/server";
import { getData } from "@/lib/tickets";

export async function GET() {
  return NextResponse.json(getData().summary);
}

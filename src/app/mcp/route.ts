import { NextResponse } from "next/server";
import { getData } from "@/lib/tickets";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "toronto-parking-tickets-geocoded", version: "1.0.0" };

const TOOLS = [
  {
    name: "tickets_ward_stats",
    description:
      "Parking ticket statistics for one Toronto ward (2023-2025 slice): ticket count, total set fines, yearly breakdown. Pass ward as its number, e.g. '10'.",
    inputSchema: {
      type: "object",
      properties: { ward: { type: "string", description: "Ward number, e.g. '10'" } },
      required: ["ward"],
    },
  },
  {
    name: "tickets_neighbourhood_stats",
    description:
      "Parking ticket statistics for one 158-model Toronto neighbourhood: ticket count and total set fines. Pass code as its number, e.g. '166'.",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string", description: "158-model neighbourhood code, e.g. '166'" } },
      required: ["code"],
    },
  },
  {
    name: "tickets_infractions",
    description:
      "Look up parking infraction codes: ticket counts and average fines. Filter by code or description text.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Infraction code, e.g. '5'" },
        q: { type: "string", description: "Search infraction descriptions, e.g. 'fire route'" },
        limit: { type: "number", description: "Max rows (default 20)" },
      },
    },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        const d = getData();
        if (name === "tickets_ward_stats") {
          const w = d.wards.find((x) => x.ward === String(args.ward));
          if (!w) return err(id, -32001, `Unknown ward ${args.ward}`);
          return ok(id, textResult(w));
        }
        if (name === "tickets_neighbourhood_stats") {
          const h = d.hoods.find((x) => x.code === String(args.code));
          if (!h) return err(id, -32001, `Unknown neighbourhood code ${args.code}`);
          return ok(id, textResult(h));
        }
        if (name === "tickets_infractions") {
          let rows = d.codebook;
          if (args.code) rows = rows.filter((x) => x.code === String(args.code));
          if (args.q) {
            const q = String(args.q).toLowerCase();
            rows = rows.filter((x) => x.desc.toLowerCase().includes(q));
          }
          const limit = Math.min(100, Math.max(1, Number(args.limit) || 20));
          return ok(id, textResult({ count: rows.length, infractions: rows.slice(0, limit) }));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}

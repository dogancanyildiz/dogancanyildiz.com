import { NextResponse } from "next/server";

// Never prerendered, never cached: a cached 200 would keep reporting healthy
// after the process stopped answering.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

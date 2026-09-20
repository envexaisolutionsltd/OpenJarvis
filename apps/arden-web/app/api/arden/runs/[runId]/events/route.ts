import { NextRequest, NextResponse } from "next/server";
import { fetchRuntimeEvents } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    const after = Math.max(0, Number(request.nextUrl.searchParams.get("after") ?? "0") || 0);
    return NextResponse.json(await fetchRuntimeEvents(runId, after));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch events";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

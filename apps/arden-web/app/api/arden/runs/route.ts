import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRuntimeRun } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";
const bodySchema = z.object({ prompt: z.string().trim().min(1).max(12000) });

export async function POST(request: NextRequest) {
  try {
    const { prompt } = bodySchema.parse(await request.json());
    const idempotencyKey = request.headers.get("idempotency-key") ?? crypto.randomUUID();
    const result = await createRuntimeRun(prompt, idempotencyKey);
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create run";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

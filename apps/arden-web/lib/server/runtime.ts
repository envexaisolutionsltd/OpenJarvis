import "server-only";
import { z } from "zod";
import type { ArdenEvent } from "@/lib/arden/types";

const eventSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1), runId: z.string().min(1), sequence: z.number().int().positive(),
  type: z.string().min(1), timestamp: z.string().min(1), payload: z.unknown().optional(),
  trust: z.enum(["trusted-runtime","user-provided","external-untrusted"]).optional(),
});

function runtimeUrl(path: string) {
  const base = process.env.ARDEN_API_URL;
  if (!base) throw new Error("ARDEN_API_URL is not configured");
  return new URL(path, base.endsWith("/") ? base : base + "/");
}
function headers(extra?: HeadersInit): HeadersInit {
  const token = process.env.ARDEN_SERVER_TOKEN;
  if (!token) throw new Error("ARDEN_SERVER_TOKEN is not configured");
  return { "content-type": "application/json", authorization: `Bearer ${token}`, ...extra };
}
export async function createRuntimeRun(prompt: string, idempotencyKey: string) {
  const response = await fetch(runtimeUrl("runs"), {
    method:"POST", headers:headers({"idempotency-key":idempotencyKey}),
    // First operational slice is intentionally web-only.
    body:JSON.stringify({prompt,capabilities:["web.read"]}), cache:"no-store"
  });
  if (!response.ok) throw new Error(`Runtime rejected run (${response.status})`);
  return response.json() as Promise<{runId:string;commandId:string;status:string}>;
}
export async function fetchRuntimeEvents(runId: string, after=0): Promise<ArdenEvent[]> {
  const response=await fetch(runtimeUrl(`runs/${encodeURIComponent(runId)}/events?after=${after}`),{headers:headers(),cache:"no-store"});
  if(!response.ok) throw new Error(`Runtime events unavailable (${response.status})`);
  return z.array(eventSchema).parse(await response.json()) as ArdenEvent[];
}
export async function cancelRuntimeRun(runId:string) {
  const response=await fetch(runtimeUrl(`runs/${encodeURIComponent(runId)}/cancel`),{method:"POST",headers:headers(),cache:"no-store"});
  if(!response.ok) throw new Error(`Runtime cancellation failed (${response.status})`);
  return response.json() as Promise<{runId:string;cancelled:boolean}>;
}

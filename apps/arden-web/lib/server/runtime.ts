import "server-only";
import { z } from "zod";
import type { ArdenEvent } from "@/lib/arden/types";

const eventSchema = z.object({
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
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...extra };
}
export async function createRuntimeRun(prompt: string, idempotencyKey: string) {
  const response = await fetch(runtimeUrl("runs"), { method: "POST", headers: headers({ "idempotency-key": idempotencyKey }), body: JSON.stringify({ prompt, capabilities: ["web.read","workspace.read"] }), cache: "no-store" });
  if (!response.ok) throw new Error(`Runtime rejected run (${response.status})`);
  return response.json() as Promise<{ runId: string }>;
}
export async function fetchRuntimeEvents(runId: string, after = 0): Promise<ArdenEvent[]> {
  const url = runtimeUrl(`runs/${encodeURIComponent(runId)}/events?after=${after}`);
  const response = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`Runtime events unavailable (${response.status})`);
  const body = z.array(eventSchema).parse(await response.json());
  return body as ArdenEvent[];
}

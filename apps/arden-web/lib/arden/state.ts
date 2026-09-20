import type { ArdenEvent, ArdenState, ConnectionState, RunStatePayload, RunStatus, RuntimeMode } from "./types";

export interface ArdenRuntimeState {
  mode: RuntimeMode;
  connection: ConnectionState;
  state: ArdenState;
  runStatus?: RunStatus;
  runId?: string;
  sequence: number;
  sequenceGap?: { expected: number; received: number };
}

export const initialArdenState: ArdenRuntimeState = {
  mode: "demo", connection: "offline", state: "standing-by", sequence: 0,
};

export function reduceArdenEvent(current: ArdenRuntimeState, event: ArdenEvent): ArdenRuntimeState {
  if (event.sequence <= current.sequence) return current;
  const expected = current.sequence + 1;
  const gap = current.sequence > 0 && event.sequence !== expected ? { expected, received: event.sequence } : undefined;
  const next: ArdenRuntimeState = { ...current, runId: event.runId, sequence: event.sequence, sequenceGap: gap };

  switch (event.type) {
    case "runtime.connected": return { ...next, mode: "connected", connection: "connected" };
    case "runtime.degraded": return { ...next, connection: "degraded" };
    case "runtime.reconnecting": return { ...next, connection: "reconnecting" };
    case "runtime.disconnected": return { ...next, mode: "offline", connection: "offline", state: "offline" };
    case "run.started": return { ...next, runStatus: "running" };
    case "run.state.changed": {
      const payload = (event.payload ?? {}) as RunStatePayload;
      return { ...next, runStatus: payload.status ?? next.runStatus, state: payload.ardenState ?? next.state };
    }
    case "approval.requested": return { ...next, runStatus: "waiting-for-approval", state: "needs-you" };
    case "security.attention": return { ...next, state: "attention" };
    case "run.cancelled": return { ...next, runStatus: "cancelled", state: "stopped" };
    case "run.failed": return { ...next, runStatus: "failed", state: "attention" };
    case "run.completed": return { ...next, runStatus: "completed", state: "standing-by" };
    default: return next;
  }
}

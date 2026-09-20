export type ArdenState =
  | "standing-by" | "listening" | "thinking" | "working" | "speaking"
  | "needs-you" | "attention" | "stopped" | "offline";

export type RuntimeMode = "demo" | "connected" | "offline";
export type ConnectionState = "connected" | "degraded" | "reconnecting" | "offline";
export type RunStatus = "created" | "queued" | "running" | "waiting-for-approval" | "paused" | "cancelling" | "completed" | "failed" | "cancelled";
export type Capability = "web.read" | "workspace.read" | "workspace.write";
export type TrustLevel = "trusted-runtime" | "user-provided" | "external-untrusted";

export type ArdenEventType =
  | "runtime.connected" | "runtime.degraded" | "runtime.reconnecting" | "runtime.disconnected"
  | "run.started" | "run.state.changed" | "run.completed" | "run.failed" | "run.cancelled"
  | "input.listening" | "model.started" | "model.completed"
  | "tool.requested" | "tool.started" | "tool.progress" | "tool.completed" | "tool.blocked"
  | "voice.started" | "voice.completed"
  | "approval.requested" | "approval.approved" | "approval.denied" | "approval.expired"
  | "security.attention" | "security.blocked" | "budget.updated" | "source.discovered";

export interface ArdenEvent {
  id: string;
  runId: string;
  sequence: number;
  type: ArdenEventType;
  timestamp: string;
  payload?: unknown;
  trust?: TrustLevel;
}

export interface ExecutionContext {
  runId: string;
  workspaceId: string;
  capabilities: readonly Capability[];
  sandboxId: string;
}

export interface RunStatePayload {
  status?: RunStatus;
  ardenState?: ArdenState;
  reason?: string;
}

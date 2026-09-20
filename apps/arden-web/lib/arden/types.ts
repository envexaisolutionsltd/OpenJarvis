export type ArdenState =
  | "standing-by"
  | "listening"
  | "thinking"
  | "working"
  | "speaking"
  | "needs-you"
  | "attention"
  | "stopped"
  | "offline";

export type RuntimeMode = "demo" | "connected" | "offline";

export type ArdenEventType =
  | "runtime.connected"
  | "runtime.disconnected"
  | "input.listening"
  | "model.started"
  | "model.completed"
  | "tool.started"
  | "tool.completed"
  | "voice.started"
  | "voice.completed"
  | "approval.requested"
  | "security.attention"
  | "run.completed"
  | "run.cancelled";

export interface ArdenEvent {
  id: string;
  runId: string;
  sequence: number;
  type: ArdenEventType;
  timestamp: string;
  payload?: unknown;
}

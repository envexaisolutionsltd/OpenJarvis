import type { ArdenEvent, ArdenState, RuntimeMode } from "./types";

export interface ArdenRuntimeState {
  mode: RuntimeMode;
  state: ArdenState;
  sequence: number;
}

export const initialArdenState: ArdenRuntimeState = {
  mode: "demo",
  state: "standing-by",
  sequence: 0,
};

export function reduceArdenEvent(current: ArdenRuntimeState, event: ArdenEvent): ArdenRuntimeState {
  if (event.sequence <= current.sequence) return current;
  const next = { ...current, sequence: event.sequence };

  switch (event.type) {
    case "runtime.connected": return { ...next, mode: "connected", state: "standing-by" };
    case "runtime.disconnected": return { ...next, mode: "offline", state: "offline" };
    case "input.listening": return { ...next, state: "listening" };
    case "model.started": return { ...next, state: "thinking" };
    case "tool.started": return { ...next, state: "working" };
    case "voice.started": return { ...next, state: "speaking" };
    case "approval.requested": return { ...next, state: "needs-you" };
    case "security.attention": return { ...next, state: "attention" };
    case "run.cancelled": return { ...next, state: "stopped" };
    case "model.completed":
    case "tool.completed":
    case "voice.completed":
    case "run.completed":
      return { ...next, state: "standing-by" };
    default:
      return next;
  }
}

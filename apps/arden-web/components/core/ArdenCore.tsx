import type { ArdenState, RuntimeMode } from "@/lib/arden/types";

const labels: Record<ArdenState, string> = {
  "standing-by": "STANDING BY",
  listening: "LISTENING",
  thinking: "THINKING",
  working: "WORKING",
  speaking: "SPEAKING",
  "needs-you": "NEEDS YOU",
  attention: "ATTENTION",
  stopped: "STOPPED",
  offline: "OFFLINE",
};

export function ArdenCore({ state, mode }: { state: ArdenState; mode: RuntimeMode }) {
  return (
    <div className={"core core--" + state} aria-label={"Arden is " + labels[state].toLowerCase()}>
      <div className="core__orbit core__orbit--outer" />
      <div className="core__orbit core__orbit--inner" />
      <div className="core__ticks" />
      <div className="core__centre">
        <span className="core__name">ARDEN</span>
        <strong>{labels[state]}</strong>
        <small>RUNTIME · {mode.toUpperCase()}</small>
      </div>
    </div>
  );
}

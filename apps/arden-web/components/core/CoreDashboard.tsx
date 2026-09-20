"use client";

import { useReducer, useState } from "react";
import { ArdenCore } from "./ArdenCore";
import { initialArdenState, reduceArdenEvent } from "@/lib/arden/state";
import type { ArdenEvent, ArdenState } from "@/lib/arden/types";

const states: ArdenState[] = ["standing-by","listening","thinking","working","speaking","needs-you","attention","stopped","offline"];

export function CoreDashboard() {
  const [runtime, dispatch] = useReducer(reduceArdenEvent, initialArdenState);
  const [demoSequence, setDemoSequence] = useState(0);

  function preview(state: ArdenState) {
    const sequence = demoSequence + 1;
    setDemoSequence(sequence);
    const map: Partial<Record<ArdenState, ArdenEvent["type"]>> = {
      "standing-by": "run.completed", listening: "input.listening", thinking: "model.started",
      working: "tool.started", speaking: "voice.started", "needs-you": "approval.requested",
      attention: "security.attention", stopped: "run.cancelled", offline: "runtime.disconnected"
    };
    dispatch({ id: "demo-" + sequence, runId: "demo", sequence, type: map[state]!, timestamp: new Date().toISOString() });
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/"><span>◉</span> ARDEN</a>
        <nav><a className="active" href="/">CORE</a><span>TASKS</span><span>LIBRARY</span><span>ACTIVITY</span></nav>
        <div className="controls"><span className="protected">◇ PROTECTED</span><span>SOUND: OFF</span><button>STOP ALL</button></div>
      </header>

      <section className="hero">
        <div className="intro">
          <p className="eyebrow">PERSONAL AGENT RUNTIME / CORE</p>
          <h1>THE INTELLIGENCE<br/>THAT IS VISIBLY AWAKE.</h1>
          <p className="lede">Know whether Arden is listening, thinking, working, waiting for you or stopped without opening a log.</p>
          <div className="states" aria-label="Core state preview">
            {states.map((state) => <button key={state} onClick={() => preview(state)} className={runtime.state === state ? "selected" : ""}><i />{state.replace("-", " ").toUpperCase()}</button>)}
          </div>
          <p className="demo-note">INTERFACE PREVIEW · Runtime actions are not connected yet.</p>
        </div>

        <div className="core-stage"><ArdenCore state={runtime.state} mode={runtime.mode} /></div>
      </section>

      <section className="telemetry">
        <div><span>STATUS</span><strong>{runtime.state === "offline" ? "Runtime unavailable." : "Nothing needs you."}</strong></div>
        <dl><div><dt>MODEL</dt><dd>—</dd></div><div><dt>TOKENS</dt><dd>0</dd></div><div><dt>COST</dt><dd>£0.00</dd></div><div><dt>LATENCY</dt><dd>—</dd></div></dl>
      </section>

      <form className="command" onSubmit={(e) => e.preventDefault()}>
        <span>›</span><input aria-label="Ask or instruct Arden" placeholder="Ask or instruct Arden..." /><button type="submit" title="Runtime not connected">↑</button>
      </form>
    </main>
  );
}

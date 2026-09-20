"use client";

import { FormEvent, useReducer, useState } from "react";
import { ArdenCore } from "./ArdenCore";
import { initialArdenState, reduceArdenEvent } from "@/lib/arden/state";
import type { ArdenEvent, ArdenState } from "@/lib/arden/types";

const states: ArdenState[] = ["standing-by","listening","thinking","working","speaking","needs-you","attention","stopped","offline"];

export function CoreDashboard() {
  const [runtime, dispatch] = useReducer(reduceArdenEvent, initialArdenState);
  const [demoSequence, setDemoSequence] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("Interface preview. Connect ARDEN_API_URL to enable real runs.");
  const [submitting, setSubmitting] = useState(false);

  function preview(state: ArdenState) {
    const sequence=demoSequence+1; setDemoSequence(sequence);
    const event: ArdenEvent={id:"demo-"+sequence,runId:"demo",sequence,type:"run.state.changed",timestamp:new Date().toISOString(),payload:{ardenState:state}};
    dispatch(event);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if(!prompt.trim()||submitting)return; setSubmitting(true);
    try {
      const response=await fetch("/api/arden/runs",{method:"POST",headers:{"content-type":"application/json","idempotency-key":crypto.randomUUID()},body:JSON.stringify({prompt})});
      const body=await response.json();
      if(!response.ok) throw new Error(body.error ?? "Runtime unavailable");
      setNotice(`Run ${body.runId} accepted. Runtime event streaming is the next integration step.`); setPrompt("");
    } catch(error) { setNotice(error instanceof Error ? error.message : "Runtime unavailable"); }
    finally { setSubmitting(false); }
  }

  return <main>
    <header className="topbar"><a className="brand" href="/"><span>◉</span> ARDEN</a><nav><a className="active" href="/">CORE</a><span>TASKS</span><span>LIBRARY</span><span>ACTIVITY</span></nav><div className="controls"><span className="protected">◇ PROTECTED</span><span>SOUND: OFF</span><button>STOP ALL</button></div></header>
    <section className="hero"><div className="intro"><p className="eyebrow">PERSONAL AGENT RUNTIME / CORE</p><h1>THE INTELLIGENCE<br/>THAT IS VISIBLY AWAKE.</h1><p className="lede">Know whether Arden is listening, thinking, working, waiting for you or stopped without opening a log.</p>
      <div className="states" aria-label="Core state preview">{states.map(state=><button key={state} onClick={()=>preview(state)} className={runtime.state===state?"selected":""}><i />{state.replace("-"," ").toUpperCase()}</button>)}</div>
      <p className="demo-note">{notice}</p></div><div className="core-stage"><ArdenCore state={runtime.state} mode={runtime.mode}/></div></section>
    <section className="telemetry"><div><span>STATUS</span><strong>{runtime.connection==="offline"?"Runtime unavailable.":runtime.connection.toUpperCase()}</strong></div><dl><div><dt>MODEL</dt><dd>—</dd></div><div><dt>TOKENS</dt><dd>0</dd></div><div><dt>COST</dt><dd>£0.00</dd></div><div><dt>LATENCY</dt><dd>—</dd></div></dl></section>
    <form className="command" onSubmit={submit}><span>›</span><input value={prompt} onChange={e=>setPrompt(e.target.value)} aria-label="Ask or instruct Arden" placeholder="Ask or instruct Arden..." /><button disabled={submitting} type="submit">{submitting?"…":"↑"}</button></form>
  </main>;
}

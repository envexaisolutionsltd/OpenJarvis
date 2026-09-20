"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-screen"><p>ARDEN / ATTENTION</p><h1>Something went wrong in the interface.</h1><p>No agent action was executed.</p><button onClick={reset}>TRY AGAIN</button></main>;
}

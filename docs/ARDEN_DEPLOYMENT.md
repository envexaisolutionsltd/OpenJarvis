# Arden Web deployment

Arden Web is the Vercel-hosted interface. The OpenJarvis Python/Rust runtime is a separate persistent service and must not be deployed as a Vercel FastAPI function.

## Vercel

Set the project's **Root Directory** to:

`apps/arden-web`

Framework Preset: Next.js

The first web milestone intentionally renders without a connected runtime. Verify `/api/health` after deployment.

Do not add a Vercel FastAPI entrypoint for an engine shim. Server runtime credentials must never use a `NEXT_PUBLIC_` prefix.

# Arden £0 Runtime

This is the production runtime layout for Arden's free-only mode. It is not a demo.

## Host requirements
A persistent Linux host with Docker/Compose, outbound HTTPS and enough RAM for the selected Ollama model. The web app remains on Vercel; this stack runs OpenJarvis separately.

## Start
1. Copy `.env.example` to `.env` and replace the runtime token.
2. Run `./scripts/start-arden-free.sh`.
3. Put an HTTPS reverse proxy in front of `127.0.0.1:8000`.
4. In Vercel set server-only `ARDEN_API_URL=https://<runtime-host>/arden/v1/` and `ARDEN_SERVER_TOKEN` to the same token.

The runtime database and Ollama models live in named Docker volumes and survive container replacement.

## Free-only invariant
`ARDEN_FREE_ONLY=true` is mandatory in this stack. Paid inference/search providers must not be selected by Arden's executor. The first live agent capability is web.read and the only registered agent tool will be web_search.

Do not expose Ollama publicly. Do not expose port 8000 directly to the Internet; terminate HTTPS in a reverse proxy/firewall and keep runtime bearer authentication enabled.

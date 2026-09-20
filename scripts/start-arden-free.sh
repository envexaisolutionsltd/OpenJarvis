#!/usr/bin/env sh
set -eu
MODEL="${ARDEN_MODEL:-qwen3:4b}"
docker compose up -d ollama
docker compose exec ollama ollama pull "$MODEL"
docker compose up -d --build arden-runtime
echo "Arden runtime is listening on 127.0.0.1:8000"

"""Narrow Arden runtime API.

This service deliberately exposes no general OpenJarvis API. The first live
slice is web-read only; filesystem, shell, messaging and deployment are absent.
"""

from __future__ import annotations
import os
from pathlib import Path
from fastapi import APIRouter, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field
from openjarvis.arden.store import ArdenRunStore

_DB=Path(os.environ.get("ARDEN_RUNTIME_DB","arden-runtime.db"))
store=ArdenRunStore(_DB)
router=APIRouter(prefix="/arden/v1", tags=["arden-runtime"])

class RunRequest(BaseModel):
    prompt: str = Field(min_length=1,max_length=12000)
    capabilities: list[str] = Field(default_factory=list)

def _auth(request: Request) -> None:
    expected=os.environ.get("ARDEN_RUNTIME_TOKEN","")
    if not expected: raise HTTPException(503,"ARDEN_RUNTIME_TOKEN is not configured")
    if request.headers.get("authorization","") != f"Bearer {expected}": raise HTTPException(401,"Unauthorized")

@router.get("/health")
def health():
    return {"status":"ok","runtime":"arden","schemaVersion":1,"capabilities":["web.read"],"tools":["web_search"]}

@router.post("/runs",status_code=202)
def create_run(body: RunRequest, request: Request, idempotency_key: str = Header(alias="Idempotency-Key")):
    _auth(request)
    # Fail closed: V1 permits exactly web.read. Any broader request is rejected.
    requested=set(body.capabilities)
    if not requested.issubset({"web.read"}):
        raise HTTPException(403,"Capability set exceeds Arden read-only V1")
    run=store.create_run(body.prompt,idempotency_key)
    if not store.events_after(run["id"]):
        store.append_event(run["id"],"run.started",{"commandId":run["command_id"],"capabilities":["web.read"]})
        store.set_status(run["id"],"queued")
    return {"runId":run["id"],"commandId":run["command_id"],"status":store.get_run(run["id"])["status"]}

@router.get("/runs/{run_id}")
def get_run(run_id: str, request: Request):
    _auth(request); run=store.get_run(run_id)
    if not run: raise HTTPException(404,"Run not found")
    return run

@router.get("/runs/{run_id}/events")
def events(run_id: str, request: Request, after: int = 0):
    _auth(request)
    if not store.get_run(run_id): raise HTTPException(404,"Run not found")
    return store.events_after(run_id,max(after,0))

@router.post("/runs/{run_id}/cancel")
def cancel(run_id: str, request: Request):
    _auth(request)
    if not store.get_run(run_id): raise HTTPException(404,"Run not found")
    changed=store.cancel(run_id)
    if changed: store.append_event(run_id,"run.cancelled",{})
    return {"runId":run_id,"cancelled":changed}

def create_arden_runtime_app() -> FastAPI:
    app=FastAPI(title="Arden Runtime",docs_url=None,redoc_url=None)
    app.include_router(router)
    return app

app=create_arden_runtime_app()

"""Persistent, append-only run/event store for the Arden runtime."""

from __future__ import annotations
import json, sqlite3, threading, uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

class ArdenRunStore:
    def __init__(self, path: str | Path) -> None:
        self.path = str(path)
        self._lock = threading.RLock()
        self._init()

    def _connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA foreign_keys=ON")
        return db

    def _init(self) -> None:
        with self._connect() as db:
            db.executescript("""
            CREATE TABLE IF NOT EXISTS arden_runs (
              id TEXT PRIMARY KEY, command_id TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
              prompt TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
              cancelled_at TEXT
            );
            CREATE TABLE IF NOT EXISTS arden_events (
              id TEXT PRIMARY KEY, run_id TEXT NOT NULL, sequence INTEGER NOT NULL,
              schema_version INTEGER NOT NULL, type TEXT NOT NULL, timestamp TEXT NOT NULL,
              payload_json TEXT NOT NULL, UNIQUE(run_id, sequence),
              FOREIGN KEY(run_id) REFERENCES arden_runs(id)
            );
            """)

    def create_run(self, prompt: str, idempotency_key: str, command_id: str | None = None) -> dict[str, Any]:
        with self._lock, self._connect() as db:
            existing=db.execute("SELECT * FROM arden_runs WHERE idempotency_key=?",(idempotency_key,)).fetchone()
            if existing: return dict(existing)
            now=_now(); run_id="run_"+uuid.uuid4().hex; command_id=command_id or "cmd_"+uuid.uuid4().hex
            db.execute("INSERT INTO arden_runs VALUES (?,?,?,?,?,?,?,NULL)",(run_id,command_id,idempotency_key,prompt,"created",now,now))
            return dict(db.execute("SELECT * FROM arden_runs WHERE id=?",(run_id,)).fetchone())

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        with self._connect() as db:
            row=db.execute("SELECT * FROM arden_runs WHERE id=?",(run_id,)).fetchone()
            return dict(row) if row else None

    def set_status(self, run_id: str, status: str) -> None:
        with self._connect() as db:
            db.execute("UPDATE arden_runs SET status=?, updated_at=? WHERE id=?",(status,_now(),run_id))

    def append_event(self, run_id: str, event_type: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        with self._lock, self._connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row=db.execute("SELECT COALESCE(MAX(sequence),0)+1 AS seq FROM arden_events WHERE run_id=?",(run_id,)).fetchone()
            seq=int(row["seq"]); event_id="evt_"+uuid.uuid4().hex; timestamp=_now()
            db.execute("INSERT INTO arden_events VALUES (?,?,?,?,?,?,?)",(event_id,run_id,seq,SCHEMA_VERSION,event_type,timestamp,json.dumps(payload or {},separators=(",",":"))))
            db.commit()
            return {"schemaVersion":SCHEMA_VERSION,"id":event_id,"runId":run_id,"sequence":seq,"type":event_type,"timestamp":timestamp,"payload":payload or {}}

    def events_after(self, run_id: str, after: int = 0) -> list[dict[str, Any]]:
        with self._connect() as db:
            rows=db.execute("SELECT * FROM arden_events WHERE run_id=? AND sequence>? ORDER BY sequence",(run_id,after)).fetchall()
        return [{"schemaVersion":r["schema_version"],"id":r["id"],"runId":r["run_id"],"sequence":r["sequence"],"type":r["type"],"timestamp":r["timestamp"],"payload":json.loads(r["payload_json"])} for r in rows]

    def cancel(self, run_id: str) -> bool:
        with self._connect() as db:
            cur=db.execute("UPDATE arden_runs SET status='cancelled', cancelled_at=?, updated_at=? WHERE id=? AND status NOT IN ('completed','failed','cancelled')",(_now(),_now(),run_id))
            return cur.rowcount == 1

from pathlib import Path
from openjarvis.arden.store import ArdenRunStore

def test_idempotent_run_and_atomic_sequence(tmp_path: Path):
    store=ArdenRunStore(tmp_path/"arden.db")
    first=store.create_run("research nextjs","same-key")
    second=store.create_run("ignored duplicate","same-key")
    assert first["id"] == second["id"]
    a=store.append_event(first["id"],"run.started",{})
    b=store.append_event(first["id"],"model.started",{})
    assert (a["sequence"],b["sequence"]) == (1,2)
    assert [e["type"] for e in store.events_after(first["id"],1)] == ["model.started"]

def test_cancel_is_idempotent(tmp_path: Path):
    store=ArdenRunStore(tmp_path/"arden.db")
    run=store.create_run("x","k")
    assert store.cancel(run["id"]) is True
    assert store.cancel(run["id"]) is False

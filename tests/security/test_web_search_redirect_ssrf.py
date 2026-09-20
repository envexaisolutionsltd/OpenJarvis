"""Security regression tests for direct URL fetching."""

from __future__ import annotations

import httpx
import pytest

from openjarvis.tools.web_search import WebSearchTool


def test_redirect_to_loopback_is_blocked(monkeypatch):
    seen = []

    def fake_get(url, **kwargs):
        seen.append(url)
        request = httpx.Request("GET", url)
        if len(seen) == 1:
            return httpx.Response(
                302,
                headers={"location": "http://127.0.0.1/admin"},
                request=request,
            )
        raise AssertionError("private redirect target must never be fetched")

    monkeypatch.setattr(httpx, "get", fake_get)

    with pytest.raises(ValueError):
        WebSearchTool._fetch_url("https://example.com/start")

    assert seen == ["https://example.com/start"]

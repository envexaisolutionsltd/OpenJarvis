"""File sensitivity policy — block access to secrets, credentials, and keys."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Union

DEFAULT_SENSITIVE_PATTERNS: frozenset[str] = frozenset(
    {
        ".env",
        ".env.*",
        "*.env",
        ".secret",
        "*.secrets",
        "credentials.*",
        "*.pem",
        "*.key",
        "*.p12",
        "*.pfx",
        "*.jks",
        "id_rsa",
        "id_ed25519",
        ".htpasswd",
        ".pgpass",
        ".netrc",
    }
)


def is_sensitive_file(path: Union[str, Path]) -> bool:
    """Return ``True`` if *path* matches a sensitive file pattern.

    Checks both the filename and the full name against
    ``DEFAULT_SENSITIVE_PATTERNS`` using :func:`fnmatch.fnmatch`.
    Uses the Rust implementation when available, falls back to Python.
    """
    try:
        from openjarvis._rust_bridge import get_rust_module

        _rust = get_rust_module()
        return _rust.is_sensitive_file(str(path))
    except ImportError:
        return _is_sensitive_file_py(str(path))


def _is_sensitive_file_py(path_str: str) -> bool:
    """Pure-Python fallback for sensitive file detection."""
    import fnmatch

    p = Path(path_str)
    name = p.name
    for pattern in DEFAULT_SENSITIVE_PATTERNS:
        if fnmatch.fnmatch(name, pattern) or fnmatch.fnmatch(str(p), pattern):
            return True
    return False


def resolve_and_check_sensitive_path(path: Union[str, Path]) -> Path:
    """Return a canonical path, rejecting sensitive aliases and targets.

    Existing symlinks are resolved before the final sensitivity decision. For
    a new file, the nearest existing parent is canonicalized so a symlinked
    parent directory cannot redirect a write into a protected location.
    """
    supplied = Path(path).expanduser()
    if is_sensitive_file(supplied):
        raise PermissionError(f"{supplied} is a sensitive file")

    if supplied.exists() or supplied.is_symlink():
        resolved = supplied.resolve(strict=True)
    else:
        parent = supplied.parent
        missing: list[str] = []
        while not parent.exists():
            missing.append(parent.name)
            parent = parent.parent
        resolved_parent = parent.resolve(strict=True)
        for part in reversed(missing):
            resolved_parent = resolved_parent / part
        resolved = resolved_parent / supplied.name

    if is_sensitive_file(resolved):
        raise PermissionError(f"{resolved} is a sensitive file")
    return resolved


def filter_sensitive_paths(paths: Iterable[Union[str, Path]]) -> List[Path]:
    """Return only non-sensitive paths from *paths*."""
    return [Path(p) for p in paths if not is_sensitive_file(p)]


__all__ = [
    "DEFAULT_SENSITIVE_PATTERNS",
    "filter_sensitive_paths",
    "is_sensitive_file",
    "resolve_and_check_sensitive_path",
]

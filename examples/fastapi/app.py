"""Minimal FastAPI handler for the branch-beacon endpoint.

Mount on /api/dev/git-branch. Returns {"branch": str | None}. Returns
None on any failure (not a repo, git missing, timeout) — the component
renders nothing in that case.
"""

import os
import subprocess

from fastapi import FastAPI

app = FastAPI()


@app.get("/api/dev/git-branch")
def git_branch() -> dict[str, str | None]:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            # Override cwd if your server starts from a subdirectory.
            cwd=os.getcwd(),
            timeout=2,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            return {"branch": None}
        branch = result.stdout.strip()
        return {"branch": branch or None}
    except Exception:  # noqa: BLE001 — silent on any failure
        return {"branch": None}

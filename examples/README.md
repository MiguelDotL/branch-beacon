# Backend reference implementations

The branch-beacon component fetches `GET /api/dev/git-branch` and expects
a JSON response shaped:

```json
{ "branch": "feat/something" }
```

…or `{ "branch": null }` when the working directory isn't a git repo, git
isn't installed, or the command fails for any reason. The component renders
nothing when `branch` is `null` — silent failure is the design.

This directory has copy-paste-ready handlers in four common backends. Each
is ~15 lines, has no third-party dependencies, and runs `git rev-parse
--abbrev-ref HEAD` with a 2-second timeout.

| Stack | File | Run |
|---|---|---|
| Express (Node) | [`express/server.js`](./express/server.js) | `node express/server.js` |
| FastAPI (Python) | [`fastapi/app.py`](./fastapi/app.py) | `uvicorn fastapi.app:app` |
| Flask (Python) | [`flask/app.py`](./flask/app.py) | `flask --app flask/app.py run` |
| Go | [`go/main.go`](./go/main.go) | `go run go/main.go` |

## Working directory

Every implementation runs `git` against the process's current working
directory by default. If your server starts from a subdirectory, you may
need to override the cwd — each file documents the one-line change.

## Security

This is a **dev-only** endpoint. Do not deploy it to production-facing
servers without gating: a leaked branch name alone is harmless, but the
`git` shell-out is an unnecessary attack surface. The Component hides
itself in production by default; the backend should match that posture.

// Minimal Express handler for the branch-beacon endpoint.
//
// Mount this on /api/dev/git-branch (or any path you configure on the
// component via the `endpoint` prop). Returns { branch: string|null }.
// Returns null on any failure — the component renders nothing in that case.

import { spawn } from "node:child_process";
import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.get("/api/dev/git-branch", (_req, res) => {
  // Override `cwd` if your server starts from a subdirectory of the repo.
  const child = spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: process.cwd(),
    timeout: 2_000,
  });

  let out = "";
  child.stdout?.on("data", (chunk) => {
    out += chunk.toString();
  });

  child.on("close", (code) => {
    if (code !== 0) return res.json({ branch: null });
    const branch = out.trim();
    res.json({ branch: branch || null });
  });

  child.on("error", () => res.json({ branch: null }));
});

app.listen(PORT, () => {
  console.log(`branch-beacon endpoint: http://localhost:${PORT}/api/dev/git-branch`);
});

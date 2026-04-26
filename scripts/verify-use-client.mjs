// Verifies the "use client" banner is present at the top of the React
// package's built bundles. Most common silent ship bug for OSS React libs:
// the directive gets stripped by the bundler and consumers using Next.js
// app router get cryptic RSC errors.
//
// Runs in CI before publish. Exits 1 on missing directive.

import { readFile } from "node:fs/promises";

const TARGETS = [
  "packages/react/dist/index.js",
  "packages/react/dist/index.cjs",
];

const DIRECTIVE = '"use client"';

let failed = false;
for (const file of TARGETS) {
  const contents = await readFile(file, "utf8").catch(() => null);
  if (contents === null) {
    console.error(`[verify-use-client] missing: ${file}`);
    failed = true;
    continue;
  }
  // Banner is the first non-empty line of the bundle.
  const firstLine = contents.split("\n", 1)[0]?.trim() ?? "";
  if (!firstLine.startsWith(DIRECTIVE)) {
    console.error(
      `[verify-use-client] ${file}: expected ${DIRECTIVE} on line 1, got ${JSON.stringify(firstLine)}`,
    );
    failed = true;
    continue;
  }
  console.log(`[verify-use-client] ${file} ✓`);
}

if (failed) process.exit(1);

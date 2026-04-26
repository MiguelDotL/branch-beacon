import { defineConfig } from "tsup";
import { readFile, writeFile } from "node:fs/promises";

const DIRECTIVE = '"use client";';

// tsup's `banner` option does not reliably preserve module-level directives
// in v8.x — esbuild treats `"use client"` as a parsed directive and strips
// it during bundling. Inject it post-build instead. CI verifies it survives.
const injectDirective = async (): Promise<void> => {
  const targets = ["dist/index.js", "dist/index.cjs"];
  for (const file of targets) {
    const contents = await readFile(file, "utf8").catch(() => null);
    if (contents === null) continue;
    if (contents.startsWith(DIRECTIVE)) continue;
    await writeFile(file, `${DIRECTIVE}\n${contents}`, "utf8");
  }
};

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  // @branch-beacon/core is private — bundle it in. Consumers get a single
  // self-contained branch-beacon dep with no transitive workspace reference.
  external: ["react", "react-dom"],
  noExternal: ["@branch-beacon/core"],
  onSuccess: injectDirective,
});

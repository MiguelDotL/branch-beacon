import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  // @branch-beacon/core is private — bundle it in.
  noExternal: ["@branch-beacon/core"],
});

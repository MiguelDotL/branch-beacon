import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  // Inject the directive at the top of every output bundle. Required so
  // Next.js app-router consumers can import this from a Server Component
  // file without RSC errors. CI greps dist files to confirm it survives.
  banner: {
    js: '"use client";',
  },
  external: ["react", "react-dom", "@branch-beacon/core"],
});

// Read process.env.NODE_ENV without requiring @types/node — go through
// globalThis so the helper is portable to browsers, Workers, and Deno.
// Bundlers (Vite, Webpack, esbuild, Next.js, CRA) statically replace this
// at build time, so the production branch dead-code-eliminates entirely.
interface NodeProcessLike {
  env?: { NODE_ENV?: string };
}

/**
 * Detect whether the current build is a production build.
 *
 * Returns `false` in any environment where `process` isn't available
 * (older browsers without a polyfill, custom runtimes). Bundlers
 * consistently inject a `process.env.NODE_ENV` shim, so this is the
 * universal hook for "is this a prod build".
 *
 * Library consumers can override per-instance via the component's
 * `enabled` prop:
 *   - `enabled={true}`  — always render (e.g. internal staging dashboards)
 *   - `enabled={false}` — never render
 *   - omitted (default) — auto: render in dev, hide in prod
 */
export const isProductionEnv = (): boolean => {
  const proc = (globalThis as { process?: NodeProcessLike }).process;
  return proc?.env?.NODE_ENV === "production";
};

/**
 * Resolve whether the indicator should render given the user's `enabled`
 * preference and the current environment. Centralised so React and Web
 * Component renderers stay in lockstep.
 *
 *   undefined  →  !isProductionEnv()    (auto)
 *   true       →  true                  (force show)
 *   false      →  false                 (force hide)
 */
export const shouldRender = (enabled: boolean | undefined): boolean => {
  if (enabled === true) return true;
  if (enabled === false) return false;
  return !isProductionEnv();
};

/**
 * Detect whether the current build is a production build.
 *
 * Reads `process.env.NODE_ENV`, which is statically replaced at build time
 * by Vite, Webpack, esbuild, Next.js, Create React App, and every other
 * mainstream bundler. In production builds this branch is dead-code-
 * eliminated, so the indicator's render path is removed entirely.
 *
 * Returns `false` in any environment where `process` isn't available (e.g.
 * older browsers without a polyfill). Bundlers consistently inject a
 * `process.env.NODE_ENV` shim, so this is the universal hook.
 *
 * Library consumers can override the auto-detection per-instance via the
 * component's `enabled` prop:
 *   - `enabled={true}`  — always render (e.g. internal staging dashboards)
 *   - `enabled={false}` — never render
 *   - omitted (default) — auto: render in dev, hide in prod
 */
export const isProductionEnv = (): boolean => {
  if (typeof process === "undefined") return false;
  return process.env?.NODE_ENV === "production";
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

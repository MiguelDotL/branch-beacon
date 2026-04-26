import type { BranchKind } from "./types.js";

/**
 * Default per-kind color tokens, expressed as nested CSS `var()` chains.
 *
 * Resolution order (browser walks the chain at paint time, first defined wins):
 *
 *   1. Explicit prop:        `colors={{ main: "#ff0066" }}`
 *   2. Override token:       `--branch-main`
 *   3. Semantic token:       `--color-danger`
 *   4. Pattern Archive:      `--color-accent-red`
 *   5. Tailwind-named:       `--color-rose-400`
 *   6. Hardcoded hex fallback
 *
 * The chains let host projects' design tokens flow through without any
 * configuration on this package's side — you drop the component in and the
 * colors look native to the surrounding UI.
 */
export const DEFAULT_COLORS: Record<BranchKind, string> = {
  main:
    "var(--branch-main, var(--color-danger, var(--color-error, " +
    "var(--color-accent-red, var(--color-rose-400, #fb7185)))))",
  dev:
    "var(--branch-dev, var(--color-warning, " +
    "var(--color-accent-yellow, var(--color-amber-400, #fbbf24))))",
  feat:
    "var(--branch-feat, var(--color-success, " +
    "var(--color-accent-green, var(--color-emerald-400, #34d399))))",
  fix:
    "var(--branch-fix, " +
    "var(--color-accent-orange, var(--color-orange-400, #fb923c)))",
  other:
    "var(--branch-other, var(--color-muted, " +
    "var(--color-text-faint, var(--color-gray-400, #9ca3af))))",
};

/**
 * Resolve the color token for a given branch kind, applying any caller
 * overrides. Undefined / nullish overrides fall through to the default
 * chain — partial overrides only replace what was explicitly set.
 */
export const colorFor = (
  kind: BranchKind,
  overrides?: Partial<Record<BranchKind, string>>,
): string => overrides?.[kind] ?? DEFAULT_COLORS[kind];

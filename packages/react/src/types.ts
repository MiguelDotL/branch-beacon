import type { CSSProperties } from "react";
import type { BranchKind, BranchShape, Classifier } from "@branch-beacon/core";

/**
 * Props for the {@link BranchIndicator} component.
 *
 * The most common usage is zero-config:
 * ```tsx
 * <BranchIndicator />
 * ```
 *
 * Defaults: SVG marker, default classifier, default colors, no polling,
 * `/api/dev/git-branch` endpoint, hidden in production.
 */
export interface BranchIndicatorProps {
  /**
   * API endpoint that returns `{ branch: string | null }` JSON.
   * @default "/api/dev/git-branch"
   */
  endpoint?: string;

  /**
   * Marker shape rendered next to (or in place of) the branch label.
   *
   * - `"svg"` — inline SVG git-branch icon (default; always crisp)
   * - `"icon"` — Unicode `⎇` glyph (renders inconsistently across fonts)
   * - `"dot"` / `"square"` / `"led"` / `"bar"` — geometric markers
   * - `"pill"` — wraps the label in a tinted background pill
   * - `"none"` — label only, no marker
   *
   * @default "svg"
   */
  shape?: BranchShape;

  /**
   * Pixel size for geometric markers (dot, square, led, bar, svg).
   * Ignored for `icon`, `pill`, and `none`.
   * @default 8
   */
  markerSize?: number;

  /**
   * Hide the branch text label, render only the marker.
   * @default false
   */
  iconOnly?: boolean;

  /**
   * Override the default per-kind colors. Any CSS color string accepted
   * (hex, rgb, hsl, `var(--token)`, `currentColor`).
   *
   * Partial overrides are merged: keys you don't specify keep their
   * default `var()` chain so host-project tokens still flow through.
   *
   * @example
   * ```tsx
   * <BranchIndicator colors={{ main: "var(--my-danger)" }} />
   * ```
   */
  colors?: Partial<Record<BranchKind, string>>;

  /**
   * Override the default classifier. Receives the raw branch string,
   * returns a {@link BranchKind}.
   *
   * Pre-built alternatives are exported from the package:
   * `defaultClassify`, `strictClassify`, `fuzzyClassify`.
   */
  classify?: Classifier;

  /**
   * Poll the endpoint every N milliseconds. `0` means fetch once on mount.
   * @default 0
   */
  pollMs?: number;

  /**
   * Visibility override.
   *
   * - `undefined` (default) — auto: rendered in development, hidden in production
   * - `true` — always render (e.g. internal staging dashboards)
   * - `false` — never render
   *
   * Production detection reads `process.env.NODE_ENV === "production"`,
   * which is statically replaced at build time by every mainstream bundler
   * (Vite, Webpack, esbuild, Next.js). Setting `enabled={false}` lets you
   * disable the indicator without removing the import.
   */
  enabled?: boolean;

  /**
   * Wrapper class for typography, spacing, or responsive visibility.
   * Inherited by the indicator's color (`color: <resolved>` is set inline).
   */
  className?: string;

  /**
   * Inline style merged onto the wrapper. The component sets `color`;
   * other properties pass through.
   */
  style?: CSSProperties;
}

/**
 * Options for {@link useBranchInfo}.
 */
export interface UseBranchInfoOptions {
  endpoint?: string;
  pollMs?: number;
  classify?: Classifier;
}

/**
 * Result of {@link useBranchInfo}.
 */
export interface BranchInfoResult {
  /** Current branch name, or `null` if unavailable / not yet loaded. */
  branch: string | null;
  /** Classification of the current branch. `"other"` when branch is null. */
  kind: BranchKind;
  /** True until the first fetch resolves (success or failure). */
  loading: boolean;
  /** Last fetch error, if any. The component intentionally renders nothing on error. */
  error: Error | null;
}

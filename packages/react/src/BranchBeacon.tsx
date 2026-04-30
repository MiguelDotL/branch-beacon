"use client";

import { useMemo, type CSSProperties } from "react";
import { colorFor, shouldRender } from "@branch-beacon/core";
import { useBranchInfo } from "./useBranchInfo.js";
import { renderMarker } from "./markers.js";
import type { BranchBeaconProps } from "./types.js";

const DEFAULT_SHAPE = "svg" as const;
const DEFAULT_MARKER_SIZE = 8;

const GLOW_FILTER = "drop-shadow(0 0 var(--branch-glow, 8px) currentColor)";

/**
 * Drop-in git branch indicator for development dashboards.
 *
 * Hidden in production by default. Adapts to the host project's design
 * tokens via CSS-variable color chains. Inherits typography from the
 * parent — only color is imposed.
 *
 * Most usage is one line:
 * ```tsx
 * <BranchBeacon />
 * ```
 */
export const BranchBeacon = (props: BranchBeaconProps) => {
  const {
    endpoint,
    shape = DEFAULT_SHAPE,
    markerSize = DEFAULT_MARKER_SIZE,
    glow = false,
    icon,
    iconOnly = false,
    colors,
    classify,
    pollMs = 0,
    enabled,
    className,
    style,
  } = props;

  const { branch, kind } = useBranchInfo({
    ...(endpoint !== undefined && { endpoint }),
    pollMs,
    ...(classify !== undefined && { classify }),
  });

  // Resolved color is recomputed only when the kind or overrides change.
  // Keeps re-renders cheap when the parent updates for unrelated reasons.
  const color = useMemo(() => colorFor(kind, colors), [kind, colors]);

  // Inner layout style is stable across renders unless shape/color shifts.
  const innerStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4em",
      ...(shape === "pill"
        ? {
            padding: "0.15em 0.6em",
            border: "1px solid currentColor",
            borderRadius: 999,
            backgroundColor:
              "color-mix(in srgb, currentColor 8%, transparent)",
          }
        : null),
    }),
    [shape],
  );

  // Production gate + missing-branch gate. Either evaluating to "no" yields
  // null — the indicator is silent on every failure mode.
  if (!shouldRender(enabled)) return null;
  if (branch === null) return null;

  // Custom icon overrides shape entirely. Wrap it so the glow filter
  // (when enabled) follows the user's icon pixels just like the built-in
  // shapes — same drop-shadow expression, same currentColor inheritance.
  const marker =
    icon !== undefined ? (
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          flexShrink: 0,
          alignItems: "center",
          ...(glow ? { filter: GLOW_FILTER } : null),
        }}
      >
        {icon}
      </span>
    ) : (
      renderMarker(shape, markerSize, glow)
    );

  return (
    <span
      className={className}
      title={`Current git branch: ${branch}`}
      style={{ color, ...style }}
    >
      <span style={innerStyle}>
        {marker}
        {!iconOnly && <span>{branch}</span>}
      </span>
    </span>
  );
};

"use client";

import { useMemo, type CSSProperties } from "react";
import { colorFor, shouldRender } from "@branch-beacon/core";
import { useBranchInfo } from "./useBranchInfo.js";
import { renderMarker } from "./markers.js";
import type { BranchIndicatorProps } from "./types.js";

const DEFAULT_SHAPE = "svg" as const;
const DEFAULT_MARKER_SIZE = 8;

/**
 * Drop-in git branch indicator for development dashboards.
 *
 * Hidden in production by default. Adapts to the host project's design
 * tokens via CSS-variable color chains. Inherits typography from the
 * parent — only color is imposed.
 *
 * Most usage is one line:
 * ```tsx
 * <BranchIndicator />
 * ```
 */
export const BranchIndicator = (props: BranchIndicatorProps) => {
  const {
    endpoint,
    shape = DEFAULT_SHAPE,
    markerSize = DEFAULT_MARKER_SIZE,
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

  return (
    <span
      className={className}
      title={`Current git branch: ${branch}`}
      style={{ color, ...style }}
    >
      <span style={innerStyle}>
        {renderMarker(shape, markerSize)}
        {!iconOnly && <span>{branch}</span>}
      </span>
    </span>
  );
};

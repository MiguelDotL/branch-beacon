"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { colorFor, shouldRender } from "@branch-beacon/core";
import { useBranchInfo } from "./useBranchInfo.js";
import { renderMarker } from "./markers.js";
import type { BranchBeaconProps } from "./types.js";

const DEFAULT_SHAPE = "svg" as const;
const DEFAULT_MARKER_SIZE = 8;
const DEFAULT_COMPACT_BELOW = 80;

const GLOW_FILTER = "drop-shadow(0 0 var(--branch-glow, 8px) currentColor)";

// SSR-safe: useLayoutEffect emits a warning during server render. Fall back
// to useEffect on the server so the component remains importable in RSC /
// Next.js / Remix loaders without `"use client"` boundaries paying a cost.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
    compactBelow = DEFAULT_COMPACT_BELOW,
    containerRef,
    className,
    style,
  } = props;

  const { branch, kind } = useBranchInfo({
    ...(endpoint !== undefined && { endpoint }),
    pollMs,
    ...(classify !== undefined && { classify }),
  });

  // Wrapper ref so we can resolve the default observation target
  // (`parentElement`) without forcing the consumer to wire one up.
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const [compact, setCompact] = useState(false);

  // ResizeObserver-driven compact mode. Skipped entirely when disabled
  // (`compactBelow === false`) so there's no observer cost in the common
  // "I don't care about this" path.
  useIsoLayoutEffect(() => {
    if (compactBelow === false) {
      // Disabled: ensure compact is off and no observer lingers.
      setCompact(false);
      return;
    }
    if (typeof ResizeObserver === "undefined") return; // SSR / older runtimes
    if (!shouldRender(enabled)) return; // production-hidden — skip work
    if (branch === null) return; // pre-fetch — nothing to measure against

    const target =
      containerRef?.current ?? wrapperRef.current?.parentElement ?? null;
    if (!target) return;

    const evaluate = (width: number) => {
      // Treat 0 as "unknown" (parent might be detached / mid-mount /
      // display:none) rather than collapsing prematurely. Only flip
      // state when the boolean actually changes, to avoid layout thrash.
      if (width <= 0) return;
      const next = width < compactBelow;
      setCompact((prev) => (prev === next ? prev : next));
    };

    // Read synchronously before paint so first render is correct when the
    // container is already narrow (no flash of full mode).
    evaluate(target.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // contentBoxSize is the modern path; fall back to contentRect for
        // older Safari that doesn't populate the size arrays.
        const box = entry.contentBoxSize?.[0];
        const width = box ? box.inlineSize : entry.contentRect.width;
        evaluate(width);
      }
    });
    observer.observe(target);

    return () => observer.disconnect();
  }, [compactBelow, containerRef, branch, enabled]);

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

  // Compact mode forces iconOnly and ensures a visible marker. If the
  // user picked `shape="none"` (label-only) and didn't supply a custom
  // `icon`, fall back to `svg` so the indicator doesn't vanish entirely
  // when the label is hidden.
  const effectiveIconOnly = iconOnly || compact;
  const effectiveShape =
    compact && shape === "none" && icon === undefined ? DEFAULT_SHAPE : shape;

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
      renderMarker(effectiveShape, markerSize, glow)
    );

  return (
    <span
      ref={wrapperRef}
      className={className}
      title={`Current git branch: ${branch}`}
      style={{ color, ...style }}
    >
      <span style={innerStyle}>
        {marker}
        {!effectiveIconOnly && <span>{branch}</span>}
      </span>
    </span>
  );
};

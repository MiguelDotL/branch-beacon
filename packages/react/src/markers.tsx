import type { CSSProperties, JSX } from "react";
import type { BranchShape } from "@branch-beacon/core";

// All markers use `currentColor` so the wrapper's `color: <resolved>` flows
// down via CSS. Keeps the renderer pure — no color prop needed, fewer args
// to thread through, single source of truth for the indicator's color.
const baseMarkerStyle: CSSProperties = {
  display: "inline-block",
  flexShrink: 0,
  background: "currentColor",
};

// drop-shadow follows the marker's visible pixels (vs. box-shadow which
// glows the bounding box). Works uniformly across solid shapes AND SVG
// paths — same expression, different glyph.
const GLOW_FILTER = "drop-shadow(0 0 var(--branch-glow, 8px) currentColor)";

// Octicon git-branch (16x16). MIT, GitHub. Inlined to keep the bundle
// dependency-free — no @octicons/react, no SVG sprite plumbing.
const SVG_VIEWBOX = "0 0 16 16";
const SVG_PATH =
  "M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z";

/**
 * Render the marker shape. Pure: input → JSX, no hooks, no I/O.
 * Color comes from the parent wrapper via `currentColor`.
 *
 * `led` is a preset for `dot + glow` — kept as a recognizable shape name
 * for the common HUD-status-light aesthetic.
 *
 * Returns `null` for shapes that don't have a separate marker
 * (`"pill"` carries its color via background; `"none"` is label-only).
 */
export const renderMarker = (
  shape: BranchShape,
  size: number,
  glow: boolean = false,
): JSX.Element | null => {
  // led = dot with glow forced on. Treating it as a preset keeps the
  // shape name useful for users who think "LED" without having to know
  // the dot+glow combo.
  const effectiveGlow = glow || shape === "led";
  const glowStyle: CSSProperties = effectiveGlow ? { filter: GLOW_FILTER } : {};

  switch (shape) {
    case "dot":
    case "led":
      return (
        <span
          aria-hidden
          style={{
            ...baseMarkerStyle,
            width: size,
            height: size,
            borderRadius: "50%",
            ...glowStyle,
          }}
        />
      );

    case "square":
      return (
        <span
          aria-hidden
          style={{
            ...baseMarkerStyle,
            width: size,
            height: size,
            ...glowStyle,
          }}
        />
      );

    case "bar":
      return (
        <span
          aria-hidden
          style={{
            ...baseMarkerStyle,
            width: Math.max(2, Math.round(size / 4)),
            height: Math.round(size * 1.6),
            ...glowStyle,
          }}
        />
      );

    case "icon":
      // Unicode ⎇ — kept for users who prefer the typographic look. SVG
      // shape is the default because ⎇ renders inconsistently across fonts
      // (some show a hollow box).
      return <span aria-hidden style={glowStyle}>⎇</span>;

    case "svg":
      return (
        <svg
          aria-hidden
          width={size}
          height={size}
          viewBox={SVG_VIEWBOX}
          fill="currentColor"
          style={{ flexShrink: 0, ...glowStyle }}
        >
          <path d={SVG_PATH} />
        </svg>
      );

    case "pill":
    case "none":
      return null;

    default: {
      // Exhaustiveness guard — if a new BranchShape lands without a case,
      // this assignment fails to type-check.
      const exhaustive: never = shape;
      return exhaustive;
    }
  }
};

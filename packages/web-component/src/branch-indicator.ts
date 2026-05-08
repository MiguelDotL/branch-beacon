import {
  classify as classifyGuarded,
  colorFor,
  defaultClassify,
  shouldRender,
  watchBranch,
  type BranchKind,
  type BranchShape,
  type Classifier,
} from "@branch-beacon/core";

const DEFAULT_ENDPOINT = "/api/dev/git-branch";
const DEFAULT_SHAPE: BranchShape = "svg";
const DEFAULT_MARKER_SIZE = 8;
const DEFAULT_COMPACT_BELOW = 80;

const SVG_VIEWBOX = "0 0 16 16";
const SVG_PATH =
  "M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z";

const GLOW_FILTER = "drop-shadow(0 0 var(--branch-glow, 8px) currentColor)";

// All shapes the React component supports — kept in lockstep with markers.tsx.
const SHAPES: ReadonlySet<BranchShape> = new Set([
  "dot",
  "square",
  "led",
  "icon",
  "svg",
  "pill",
  "bar",
  "none",
]);

const isShape = (value: string | null): value is BranchShape =>
  value !== null && SHAPES.has(value as BranchShape);

const parseEnabled = (value: string | null): boolean | undefined => {
  if (value === null || value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const parseColors = (
  value: string | null,
): Partial<Record<BranchKind, string>> | undefined => {
  if (value === null || value === "") return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Partial<Record<BranchKind, string>>;
    }
  } catch {
    /* malformed JSON falls back to defaults */
  }
  return undefined;
};

// Parse the `compact-below` attribute. Mirrors the React prop semantics:
//   - absent  → default threshold (enabled)
//   - "false" → disabled
//   - number  → custom threshold
//   - garbage → default threshold (silent fallback, never throws)
const parseCompactBelow = (value: string | null): number | false => {
  if (value === null) return DEFAULT_COMPACT_BELOW;
  if (value === "false") return false;
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return n;
  return DEFAULT_COMPACT_BELOW;
};

/**
 * `<branch-beacon>` — vanilla Web Component twin of the React component.
 *
 * Mirrors the React API as HTML attributes (kebab-case where camelCase
 * would otherwise be used). Same data flow, same color resolution, same
 * production-hide behavior — same `@branch-beacon/core` plumbing.
 *
 * Attributes:
 *   - `endpoint`        (default: `"/api/dev/git-branch"`)
 *   - `shape`           (default: `"svg"`; one of dot|square|led|icon|svg|pill|bar|none)
 *   - `marker-size`     (default: `8`)
 *   - `glow`            (presence ⇒ true; default: false)
 *   - `icon-only`       (presence ⇒ true; default: false)
 *   - `poll-ms`         (default: `0`)
 *   - `enabled`         (`"true"` | `"false"`; default: auto-hide in production)
 *   - `colors`          (JSON-encoded `{ main, dev, feat, fix, other }`)
 *   - `compact-below`   (number px, default `80`; `"false"` disables — collapses to icon-only when the watched container is narrower)
 *
 * Container override (escape hatch): assign an `Element` to the
 * `container` JS property to drive compact mode off something other
 * than `parentElement` (custom elements have no React-style refs):
 *
 *   const beacon = document.querySelector("branch-beacon");
 *   beacon.container = document.querySelector(".sidebar");
 *
 * Custom icon escape hatch: project content into the `icon` slot to
 * replace the built-in marker entirely. `shape` is ignored in that case;
 * `glow` and color theming still apply.
 *
 *   <branch-beacon>
 *     <svg slot="icon" viewBox="0 0 16 16" fill="currentColor">…</svg>
 *   </branch-beacon>
 *
 * Color theming via CSS custom properties on the host:
 *   `branch-beacon { --branch-main: #ff0066; }` flows through the
 *   default color chain without any JS configuration.
 *
 * Exposes `::part(marker)` and `::part(label)` for outside-Shadow styling.
 */
export class BranchBeaconElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [
      "endpoint",
      "shape",
      "marker-size",
      "glow",
      "icon-only",
      "poll-ms",
      "enabled",
      "colors",
      "compact-below",
    ];
  }

  // Pluggable for tests / advanced use cases. Defaulted to the bundled
  // classifier; no public API to swap it from HTML (functions can't be
  // attribute values), but JS consumers can assign to `el.classify`.
  classify: Classifier = defaultClassify;

  private branch: string | null = null;
  private kind: BranchKind = "other";
  private stopWatcher: (() => void) | null = null;
  private root: ShadowRoot;
  private wrapper: HTMLSpanElement;
  private markerHost: HTMLSpanElement;
  private markerDefault: HTMLSpanElement;
  private label: HTMLSpanElement;
  private styleEl: HTMLStyleElement;

  // Compact-mode state. `compact` is recomputed by the resize observer
  // and consumed by render(); `_container` is the override target (set
  // imperatively, since custom elements have no ref equivalent).
  private compact: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private observedTarget: Element | null = null;
  private _container: Element | null = null;

  /**
   * Override the element whose width drives compact mode. Defaults to
   * `this.parentElement`. Set imperatively from JS:
   *
   *   beacon.container = someElement;
   *
   * Pass `null` to revert to the default.
   */
  get container(): Element | null {
    return this._container;
  }
  set container(value: Element | null) {
    if (this._container === value) return;
    this._container = value;
    if (this.isConnected) this.applyResizeObserver();
  }

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });

    this.styleEl = document.createElement("style");
    this.styleEl.textContent = `
      :host { display: inline-flex; align-items: center; gap: 0.4em; }
      :host([hidden]) { display: none; }
      .inner { display: inline-flex; align-items: center; gap: 0.4em; }
      .pill {
        padding: 0.15em 0.6em;
        border: 1px solid currentColor;
        border-radius: 999px;
        background-color: color-mix(in srgb, currentColor 8%, transparent);
      }
      [part="marker"] {
        display: inline-flex;
        flex-shrink: 0;
        align-items: center;
      }
    `;

    this.wrapper = document.createElement("span");
    this.wrapper.className = "inner";

    this.markerHost = document.createElement("span");
    this.markerHost.setAttribute("part", "marker");
    this.markerHost.setAttribute("aria-hidden", "true");

    // Slot enables custom icon override: <svg slot="icon">…</svg> in the
    // light DOM replaces the fallback. The fallback span (`markerDefault`)
    // is what we manipulate for built-in shapes.
    const slot = document.createElement("slot");
    slot.setAttribute("name", "icon");
    this.markerDefault = document.createElement("span");
    this.markerDefault.setAttribute("aria-hidden", "true");
    slot.append(this.markerDefault);
    this.markerHost.append(slot);

    this.label = document.createElement("span");
    this.label.setAttribute("part", "label");

    this.wrapper.append(this.markerHost, this.label);
    this.root.append(this.styleEl, this.wrapper);
  }

  connectedCallback(): void {
    this.refresh();
    this.applyResizeObserver();
  }

  disconnectedCallback(): void {
    this.stopWatcher?.();
    this.stopWatcher = null;
    this.teardownResizeObserver();
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    this.refresh();
    if (name === "compact-below" || name === "enabled") {
      this.applyResizeObserver();
    }
  }

  // Set up (or tear down) the parent-width observer based on current
  // attributes. Skips work entirely when disabled, hidden in production,
  // or running in a runtime without ResizeObserver — same "cheap when
  // unused" contract as the React side.
  private applyResizeObserver(): void {
    this.teardownResizeObserver();

    const compactBelow = parseCompactBelow(this.getAttribute("compact-below"));
    if (compactBelow === false) {
      if (this.compact) {
        this.compact = false;
        if (this.branch !== null) this.render();
      }
      return;
    }
    if (typeof ResizeObserver === "undefined") return;

    const enabled = parseEnabled(this.getAttribute("enabled"));
    if (!shouldRender(enabled)) return;

    const target = this._container ?? this.parentElement;
    if (!target) return;

    const evaluate = (width: number) => {
      if (width <= 0) return;
      const next = width < compactBelow;
      if (this.compact === next) return;
      this.compact = next;
      if (this.branch !== null) this.render();
    };

    // Synchronous read so the first render reflects the parent's actual
    // width — no flash of full mode in already-narrow containers.
    evaluate(target.getBoundingClientRect().width);

    this.observedTarget = target;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.contentBoxSize?.[0];
        const width = box ? box.inlineSize : entry.contentRect.width;
        evaluate(width);
      }
    });
    this.resizeObserver.observe(target);
  }

  private teardownResizeObserver(): void {
    if (this.resizeObserver && this.observedTarget) {
      this.resizeObserver.unobserve(this.observedTarget);
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.observedTarget = null;
  }

  private refresh(): void {
    this.stopWatcher?.();
    this.stopWatcher = null;

    const enabled = parseEnabled(this.getAttribute("enabled"));
    if (!shouldRender(enabled)) {
      this.hidden = true;
      return;
    }
    this.hidden = false;

    const endpoint = this.getAttribute("endpoint") ?? DEFAULT_ENDPOINT;
    const pollMs = Number(this.getAttribute("poll-ms") ?? "0") || 0;

    this.stopWatcher = watchBranch({ endpoint, pollMs }, (update) => {
      const next = update.branch;
      if (next === this.branch) return;
      this.branch = next;
      this.kind =
        next === null ? "other" : classifyGuarded(this.classify, next);
      this.render();
    });
  }

  private render(): void {
    if (this.branch === null) {
      this.wrapper.style.display = "none";
      return;
    }
    this.wrapper.style.display = "inline-flex";

    const shapeAttr = this.getAttribute("shape");
    const shape: BranchShape = isShape(shapeAttr) ? shapeAttr : DEFAULT_SHAPE;
    const markerSize =
      Number(this.getAttribute("marker-size") ?? String(DEFAULT_MARKER_SIZE)) ||
      DEFAULT_MARKER_SIZE;
    const iconOnly = this.hasAttribute("icon-only");
    const glow = this.hasAttribute("glow") || shape === "led";
    const colors = parseColors(this.getAttribute("colors"));

    // Compact-mode equivalents of the React logic. If the user picked
    // shape="none" (label-only) AND didn't slot a custom icon, fall back
    // to svg so the indicator stays visible when the label is hidden.
    const hasSlottedIcon = this.querySelector(':scope > [slot="icon"]') !== null;
    const effectiveIconOnly = iconOnly || this.compact;
    const effectiveShape: BranchShape =
      this.compact && shape === "none" && !hasSlottedIcon
        ? DEFAULT_SHAPE
        : shape;

    this.style.color = colorFor(this.kind, colors);
    this.title = `Current git branch: ${this.branch}`;

    this.wrapper.classList.toggle("pill", effectiveShape === "pill");

    // Glow goes on markerHost so it covers BOTH the fallback default
    // marker AND any slotted custom icon — uniform behavior.
    this.markerHost.style.filter = glow ? GLOW_FILTER : "";

    // Reset and re-render the default marker (the slot fallback).
    this.markerDefault.replaceChildren();
    this.markerDefault.removeAttribute("style");
    this.renderDefaultMarker(effectiveShape, markerSize);

    this.label.textContent = effectiveIconOnly ? "" : this.branch;
    this.label.style.display = effectiveIconOnly ? "none" : "";
  }

  private renderDefaultMarker(shape: BranchShape, size: number): void {
    const m = this.markerDefault;
    switch (shape) {
      case "dot":
      case "led":
        // led is dot+glow; glow is applied at markerHost level above.
        m.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:currentColor;display:inline-block`;
        return;
      case "square":
        m.style.cssText = `width:${size}px;height:${size}px;background:currentColor;display:inline-block`;
        return;
      case "bar": {
        const w = Math.max(2, Math.round(size / 4));
        const h = Math.round(size * 1.6);
        m.style.cssText = `width:${w}px;height:${h}px;background:currentColor;display:inline-block`;
        return;
      }
      case "icon":
        m.textContent = "⎇";
        return;
      case "svg": {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("width", String(size));
        svg.setAttribute("height", String(size));
        svg.setAttribute("viewBox", SVG_VIEWBOX);
        svg.setAttribute("fill", "currentColor");
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", SVG_PATH);
        svg.append(path);
        m.append(svg);
        return;
      }
      case "pill":
      case "none":
        return;
      default: {
        const exhaustive: never = shape;
        void exhaustive;
      }
    }
  }
}

const ELEMENT_TAG_BEACON = "branch-beacon";

/**
 * Register the `<branch-beacon>` custom element. Idempotent: re-calls
 * are no-ops. Optionally pass a different tag name to avoid collisions
 * with another library that's already registered the default.
 */
export const defineBranchBeacon = (tagName: string = ELEMENT_TAG_BEACON): void => {
  if (customElements.get(tagName)) return;
  customElements.define(tagName, BranchBeaconElement);
};

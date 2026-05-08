# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Container-width-aware compact mode.** The beacon now observes its container's width via `ResizeObserver` and collapses to a marker-only indicator when the container narrows below the threshold. Enabled by default at `80px`. Set `compactBelow` to a custom number to change the breakpoint, or `false` to opt out. SSR-safe (no `ResizeObserver` access at module/render time), zero observer cost when disabled.
  - React: new `compactBelow?: number | false` and `containerRef?: RefObject<HTMLElement>` props on `BranchBeacon`.
  - Web component: new `compact-below` attribute and imperative `container` property on `BranchBeaconElement`.
  - In compact mode, `shape="none"` without a custom `icon` falls back to the default `svg` marker so the indicator stays visible when the label is hidden.

## [1.0.0] — 2026-04-30 — Stable API

### Changed

- **Component renamed: `BranchIndicator` → `BranchBeacon`** (matching the package name). Migrate React imports from `BranchIndicator` / `BranchIndicatorProps` to `BranchBeacon` / `BranchBeaconProps`. Migrate web-component usage from `<branch-indicator>` and `defineBranchIndicator()` to `<branch-beacon>` and `defineBranchBeacon()`.
- `defaultClassify` now recognizes `development` and `staging` as `dev`-kind alongside the existing `dev` / `develop`. Behavior change for anyone using these literal branch names — the indicator's color shifts from gray (`other`) to amber (`dev`). `strictClassify` and `fuzzyClassify` are unchanged.
- README intros and npm package descriptions rewritten to a warmer voice: "A friendly little git branch indicator that lives in the corner of your dev client. Color-coded so working branches feel safe and protected ones stand out."

### Removed

- The deprecated `BranchIndicator` / `BranchIndicatorElement` / `BranchIndicatorProps` / `defineBranchIndicator` aliases that briefly shipped between the rename and v1.0. Use the canonical names listed above.

### Added

- Issue templates (`bug_report.md`, `feature_request.md`) under `.github/ISSUE_TEMPLATE/` and a pull-request template at `.github/pull_request_template.md` to streamline contributor reports.
- README links Conventional Commits from the Contributing section and embeds a glow-modifier demo image in the React Customization section.

## [0.1.2] — Extensibility (glow modifier, custom icons, led redesign)

### Added

- **`glow` prop / `glow` attribute** — orthogonal modifier that applies a CSS `drop-shadow` to the marker. Works on every shape including SVG and Unicode glyphs (the glow follows the visible pixels, not the bounding box). Tune the radius via the `--branch-glow` CSS variable.
- **Custom icon escape hatch** — replace the default Octicon git-branch glyph with arbitrary content:
  - React: new `icon?: ReactNode` prop. When set, `shape` is ignored.
  - Web component: new `<slot name="icon">` for projecting custom HTML/SVG.

### Changed

- **`shape="led"` is now round.** Previously `led` rendered as a square with a `box-shadow` glow, which violated the mental model — every developer expects an LED to be round. `led` is now a preset alias for `dot + glow`, matching what the name implies. **Visual breaking change** for anyone using `shape="led"` today; if you needed the square-with-glow look, switch to `shape="square" glow`.
- Glow implementation switched from `box-shadow` to `filter: drop-shadow`, so it now works correctly on SVG paths and Unicode glyphs (where `box-shadow` only glowed the bounding rectangle).

## [0.1.1] — Visual assets in READMEs

### Added

- Hero screenshot, shape variants, and risk-inverted color samples embedded in the README and per-package npm pages.
- Bug fix: removed a stray `process.env.NODE_ENV = "development"` from `apps/storybook/.storybook/preview.ts` that crashed the preview iframe in browsers (process is not defined). Doesn't affect published packages.

## [0.1.0] — Initial release

### Added

- React component (`branch-beacon`) with `BranchIndicator` + `useBranchInfo` hook.
- Web Component (`branch-beacon-element`) registering `<branch-indicator>`.
- Eight marker shapes: `svg` (default), `icon`, `dot`, `square`, `led`, `bar`, `pill`, `none`.
- Risk-inverted color scheme via nested CSS-variable chains.
- Three classifier presets: `defaultClassify`, `strictClassify`, `fuzzyClassify`.
- Production auto-hide (via `process.env.NODE_ENV`) with explicit `enabled` override.
- Reference backend handlers for Express, FastAPI, Flask, and Go.
- Storybook with every prop wired to a control.

[Unreleased]: https://github.com/MiguelDotL/branch-beacon/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v1.0.0
[0.1.2]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.2
[0.1.1]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.1
[0.1.0]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.0

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- **Breaking:** dropped the deprecated `BranchIndicator` / `BranchIndicatorElement` / `BranchIndicatorProps` / `defineBranchIndicator` aliases that shipped alongside the `BranchBeacon` rename. Migrate imports to the canonical names.

### Added

- `BranchBeacon` is now the canonical component name, matching the package name. `BranchIndicator` and `BranchIndicatorElement` remain exported as deprecated aliases (will be removed in v1.0). HTML tag `<branch-beacon>` replaces `<branch-indicator>` as the auto-registered tag on import; call `defineBranchIndicator()` manually if you need the old tag name.

### Changed

- README intros and npm package descriptions rewritten to match the social-preview voice ("A friendly little git branch indicator that lives in the corner of your dev client. Color-coded so working branches feel safe and protected ones stand out."). Repo-only update — the npm descriptions will refresh on the next release.
- `defaultClassify` now recognizes `development` and `staging` as `dev`-kind alongside the existing `dev` / `develop`. Behavior change for anyone using these literal branch names — the indicator's color shifts from gray (`other`) to amber (`dev`). `strictClassify` and `fuzzyClassify` are unchanged.
- README links Conventional Commits (already documented in `CONTRIBUTING.md`) from the Contributing section, and embeds a glow-modifier demo image in the React Customization section.

### Added

- Issue templates (`bug_report.md`, `feature_request.md`) under `.github/ISSUE_TEMPLATE/` and a pull-request template at `.github/pull_request_template.md` to streamline contributor reports.

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

[Unreleased]: https://github.com/MiguelDotL/branch-beacon/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.2
[0.1.1]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.1
[0.1.0]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.0

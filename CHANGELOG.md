# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/MiguelDotL/branch-beacon/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.1
[0.1.0]: https://github.com/MiguelDotL/branch-beacon/releases/tag/v0.1.0

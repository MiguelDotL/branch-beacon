# Contributing

Thanks for the interest. branch-beacon is a small, opinionated library — the goal is to keep it small and opinionated.

## Local development

```bash
git clone https://github.com/MiguelDotL/branch-beacon.git
cd branch-beacon
pnpm install
```

One-time MSW setup so Storybook can mock the endpoint:

```bash
pnpm --filter @branch-beacon/storybook exec npx msw init public/ --save
```

### Common commands

| Command | What it does |
|---|---|
| `pnpm storybook` | Storybook on http://localhost:6006 |
| `pnpm test` | Vitest across all packages |
| `pnpm typecheck` | TS check across all packages |
| `pnpm build` | Build all packages with tsup |
| `pnpm verify-use-client` | Confirm the React build's `"use client"` banner survives |

## Project layout

```
packages/core/           # pure helpers (classify, colors, env, watch, types)
packages/react/          # React component (depends on core)
packages/web-component/  # custom element (depends on core)
apps/storybook/          # demo + docs
examples/                # backend reference impls
```

The dependency arrow is one-way: `react` and `web-component` both import from `core`, never each other. If you find yourself wanting one consumer package to import from the other, it probably belongs in `core` instead.

## Code-quality bar

The short version:

- **No `any`, no non-null `!`, no `as` casts** without a comment explaining why.
- **Pure functions are the default.** Side effects only in the React hook and the Web Component's `connectedCallback`.
- **Explicit discriminated unions** with exhaustive switches.
- **Functions ≤ 30 lines.** Past that, extract.
- **Components ≤ 10 props.** Past that, group into a config object.
- **Comments explain WHY, never WHAT.**

PRs that violate these are fine to open — review will surface them. Don't pre-bikeshed yourself out of contributing.

## Tests

Every public function in `core` should have a test. Component-level integration tests live in `packages/react` and `packages/web-component`. Snapshot tests are fine for marker rendering; everything else should assert behavior, not output shape.

## Commit conventions

[Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — user-visible feature
- `fix:` — bug fix
- `docs:` — README, JSDoc, this file
- `refactor:` — internal restructuring, no behavior change
- `test:` — test-only changes
- `chore:` — tooling, deps, CI

## Releases

Tag-driven. Push a tag matching `v*` and the [publish workflow](./.github/workflows/publish.yml) runs CI, builds, and publishes both packages to npm.

```bash
# Bump the version in both packages (manually for now).
git tag v0.1.1
git push origin v0.1.1
```

## Filing issues

Helpful issue reports include:

- The minimal reproduction (a single `<BranchBeacon />` invocation, ideally in a CodeSandbox).
- What you saw vs. what you expected.
- Browser, React version, bundler.

For "doesn't show up", first check: is `process.env.NODE_ENV` set to `"production"`? Try `enabled={true}` to confirm.

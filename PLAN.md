# Open-Source Package: Drop-in Git Branch Indicator

> **Plan portability**: This plan is the implementation kickoff doc for a new standalone repo. After approval, copy to the new repo's root as `PLAN.md` so the repo carries its own design context from day one. Source of truth lives at `/Users/mbp2019/.claude/plans/luminous-wondering-dusk.md` until the repo is created.

## Context

Voicepool's header has a small color-coded indicator showing the current git branch — built today as a single React component (`frontend/src/components/BranchIndicator.tsx`, 158 lines) plus a 16-line Express endpoint (`/api/dev/git-branch`) that shells out to `git rev-parse --abbrev-ref HEAD`. The component already adapts to host UIs: typography is inherited from the parent, colors flow through CSS-variable chains (`var(--branch-main, var(--color-danger, var(--color-accent-red, #fb7185)))`).

Goal: extract this into a standalone, professional open-source repo. **Public GitHub repo + npm publish + Storybook deployed to GitHub Pages.** Two consumer formats so it's stack-agnostic: React component for the React ecosystem, vanilla **Web Component** for everything else (Vue, Svelte, Astro, plain HTML).

**Package name**: TBD — workshopping separately. Plan refers to it as `<NAME>`. Sanity check (against npm registry, April 2026): `branch-pulse` and `branchstamp` are clean. **Avoid `gitpulse`** — the npm name is free, but multiple existing products use that exact name (gitpulse.xyz, github-pulse.com, `git-pulse` GitHub org), causing brand/SEO collision.

## Goals

1. `npm install <NAME>` → drop-in component that picks up the host project's design tokens automatically.
2. Two consumer paths: `import { BranchIndicator } from '<NAME>/react'` and `<branch-indicator>` custom element.
3. **Hidden in production by default** — auto-detected via `process.env.NODE_ENV === 'production'`. Dev-only readouts shouldn't ship to end users.
4. Storybook covers every shape × size × color combination, with **every prop wired to a control**.
5. Reference backend implementations for Node, Python, and Go.
6. CI on GitHub Actions: type-check + build + test on PR; tag → publish to npm + deploy Storybook to Pages.

## Non-goals

- Vue/Svelte/Solid first-class wrappers (the Web Component covers them).
- Auth/security on the backend endpoint (it's a dev readout; consumers gate themselves).
- React Native (different rendering primitives).
- Storybook **CSF Factories** (Storybook 10 new) — too early-adopter for a stable OSS surface; stick with CSF3 + `satisfies Meta<typeof X>`.

## Tech-stack decisions (verified against April 2026 reality)

| Decision | Choice | Rationale |
|---|---|---|
| Build tool | **tsup** | esbuild-powered, dual ESM/CJS + d.ts in one config, supports `banner` for `"use client"`. Vite library mode is over-config for a single component. |
| Output formats | **Dual ESM + CJS** | Node 22's `require(esm)` makes ESM-only viable for opinionated libs, but for broad adoption (Vite + Webpack + Next.js pages + app router + Jest configs) dual is still the safer default. |
| Type definitions | **Per-format `.d.ts` + `.d.cts`** | `"types"` condition first in each branch of `exports`. |
| `peerDependencies` | `react: ^18.0.0 || ^19.0.0`, `react-dom` same | React 17 is dropped — EOL for hooks-modern usage and not worth the constraint. |
| RSC compat | **`"use client"` banner injected by tsup** | Required for Next.js app router consumers. Verify dist files actually have the directive at the top — most common silent OSS bug. |
| Monorepo | **pnpm workspaces, no Turborepo** | 3 packages, single maintainer. Turborepo's caching wins matter at 10+ packages or in heavy CI. Add later if build times annoy. |
| Shared TS helpers | **Internal workspace package** `packages/core` (`private: true`), bundled into both react/web-component dists | Path aliases break at publish time; relative cross-package imports break tsup. Workspace dep is the canonical pattern. |
| Storybook | **Storybook 10.3.5** (not 8/9 — both are old) | Node 20.16+/22.19+/24+ required. **`@storybook/addon-essentials` is dead** — frozen at 8.6.14. Controls/actions/viewport now in core. Install only `@storybook/addon-docs` and `@storybook/addon-a11y`. |
| Storybook scope | **One Storybook (React renderer)** | Storybook's `framework` field is singular. Can't host React + Web Component renderers in one config. Two Storybooks is technically purer (deploy at `/react/` and `/wc/`); single Storybook with WC stories that mount the custom element via `useEffect` wrapper is friction-minimal. **Picking single** — note the trade-off (less polished WC docs page, but one config to maintain). |
| Mocking in stories | **`msw-storybook-addon@2.0.7` + `msw@2.13`** | MSW v2 API (`http.get`, not `rest.get`). Initialize via `mswLoader`, NOT in `addons[]`. |
| Pages deploy | **`actions/deploy-pages@v4`** | First-party action. Bitovi's action (linked from Storybook docs) is the older 2024 pattern. |
| docgen | **`react-docgen-typescript`** | Lets Storybook auto-derive control options from TS literal unions. Slower than the default `react-docgen` (JS-only) but worth it for a component library. |

## Engineering quality bar

This is a small library that will be read by other developers as an example of how to build one. The code is the product as much as the runtime behavior is. Concrete commitments:

### Module discipline (one responsibility each)

| Module | Owns | Does NOT own |
|---|---|---|
| `core/classify.ts` | branch-string → `BranchKind` mapping | colors, rendering, fetching |
| `core/colors.ts` | default CSS-variable color chains, `colorFor(kind, overrides)` resolver | classification, rendering |
| `core/types.ts` | `BranchKind`, `BranchShape`, shared types | implementations |
| `react/useBranchInfo.ts` | fetch + AbortController + polling + lifecycle | UI, classification |
| `react/markers.tsx` | pure shape renderers (input → JSX) | data, classification |
| `react/BranchIndicator.tsx` | composing hook + classifier + marker into one element | data, shape rendering |
| `web-component/branch-indicator.ts` | custom-element lifecycle + attribute mapping + Shadow DOM | classification, color resolution |

If a file grows responsibilities, split it before merge. The dependency arrow is strictly **`react`/`web-component` → `core`** — never reverse, never lateral.

### Architecture (data flow)

```
                       ┌─────────────────────────┐
                       │   <NAME>/core (pure)    │
                       │  classify, colors, types│
                       └────────────┬────────────┘
                                    │ workspace dep
              ┌─────────────────────┼─────────────────────┐
              ▼                                           ▼
   ┌──────────────────────┐                   ┌──────────────────────┐
   │   <NAME>/react       │                   │ <NAME>/web-component │
   │ ┌──────────────────┐ │                   │ ┌──────────────────┐ │
   │ │ useBranchInfo    │ │                   │ │ connectedCallback│ │
   │ │ (fetch + poll)   │ │                   │ │ (fetch + poll)   │ │
   │ └────────┬─────────┘ │                   │ └────────┬─────────┘ │
   │          ▼           │                   │          ▼           │
   │ ┌──────────────────┐ │                   │ ┌──────────────────┐ │
   │ │ BranchIndicator  │ │                   │ │ Shadow DOM render│ │
   │ │ (presenter)      │ │                   │ │                  │ │
   │ └──────────────────┘ │                   │ └──────────────────┘ │
   └──────────────────────┘                   └──────────────────────┘
```

Both consumer packages run the same fetch/classify/color logic, just rendered differently. The `core` package has zero React or DOM imports — it's testable without a renderer.

### Code quality rules (enforced)

These are not aspirations — they're the bar for landing a PR:

- **No `any`, no non-null assertions (`!`), no `as` casts** unless commented with the reason. ESLint rules enforce.
- **Pure functions are the default.** A function with no I/O is a pure function — keep it that way. Side effects are isolated to `useBranchInfo` (React) and `connectedCallback` (Web Component).
- **Explicit discriminated unions** for `BranchKind` and `BranchShape`, exhaustive switches checked by `satisfies never` in default branches.
- **Named constants for any non-obvious literal.** No `setTimeout(..., 8)` — use `const POLL_DEFAULT_MS = 0`.
- **Function length cap: ~30 lines.** If a function grows past that, look for an extractable subfunction. Markers, classify, color resolver should each be one screen.
- **Component prop count cap: ~10.** Past that, consider grouping into a config object. Current API is at 9 — tight.
- **JSX nesting cap: 4 levels.** Past that, extract a sub-component.
- **Boolean props named affirmatively.** `iconOnly` ✓, not `hideText`.
- **Public exports get JSDoc** with at least a one-line description. IntelliSense should be sufficient — users shouldn't need to read source.
- **Comments explain WHY, never WHAT.** If you wrote it, the diff already shows what.
- **No magic in the API.** Defaults are sensible; nothing surprises. A user reading the prop list should be able to predict behavior.

### Anti-patterns explicitly out of scope

- **No prop spreading on the wrapper** (`<span {...rest}>`) — every prop is intentional and typed.
- **No render-prop / children-as-function APIs** — too clever for a presentational indicator. Headless hook (`useBranchInfo`) is the escape hatch for custom UI.
- **No internal context** — component is leaf-shaped, no provider needed.
- **No CSS-in-JS runtime** — inline `style` for color (the only dynamic value) + className passthrough. No emotion/styled-components.
- **No barrel re-exports of internals** — only the documented public API leaves `index.ts`.
- **No premature abstraction.** Three shape renderers that share two lines isn't an abstraction opportunity, it's three functions.

### Performance budget

- **Bundle size**: React build ≤ 4 KB gzipped. WC build ≤ 5 KB gzipped (Shadow DOM cost). CI fails if either crosses by >20%. Use `size-limit` for the gate.
- **Re-render cost**: memoize the marker style object and resolved color via `useMemo`. The hook should not cause re-render on identical poll responses (compare branch string before `setState`).
- **Network**: one fetch per mount; poll only if `pollMs > 0`. Always `AbortController` on cleanup.

### Testing strategy

Tight, deterministic, fast. Vitest in jsdom mode. Targets:

| Module | What's tested |
|---|---|
| `classify` | Table-driven: every regex branch, plus edge cases (`""`, `"feat"` no slash, `"main"`/`"master"`/`"dev"`/`"develop"`, `release/foo`, `hotfix/bar`, custom strings) |
| `colors.colorFor` | Each `BranchKind` returns the chained var() string; override merges correctly; missing key falls through |
| `useBranchInfo` | Mount-fetch path, error path, poll path (`vi.advanceTimersByTime`), abort on unmount, branch-unchanged no-rerender |
| `markers` | Snapshot per shape × markerSize; SVG icon renders deterministic markup |
| Integration | One Vitest + Testing Library test mounting `<BranchIndicator />` against MSW with a mocked endpoint, asserting visible label + color |

No browser e2e — Storybook is the visual regression surface. If it ever needs e2e, Playwright via `@storybook/test-runner` is the path.

### API ergonomics — the 80% case

The most common usage should be one line:

```tsx
<BranchIndicator />
```

Defaults handle everything: `/api/dev/git-branch` endpoint, SVG marker, default colors, no polling. Every additional prop is opt-in and adds capability without re-reading docs. This is the design contract — defaults must remain sensible as the library evolves.

## Repo layout

Standalone repo, separate from voicepool:

```
<NAME>/
├── packages/
│   ├── core/                           # internal: classify, colors, types
│   │   ├── src/
│   │   │   ├── classify.ts             # branch → kind classifier
│   │   │   ├── colors.ts               # default CSS-var color chains
│   │   │   ├── types.ts                # BranchKind, BranchShape
│   │   │   └── index.ts
│   │   ├── package.json                # private: true
│   │   └── tsup.config.ts
│   ├── react/                          # @<NAME>/react entry (or just <NAME>)
│   │   ├── src/
│   │   │   ├── BranchIndicator.tsx     # main component (refactored — see below)
│   │   │   ├── useBranchInfo.ts        # headless data hook (NEW)
│   │   │   ├── markers.tsx             # shape renderers
│   │   │   └── index.ts                # public surface
│   │   ├── package.json
│   │   └── tsup.config.ts
│   └── web-component/                  # vanilla custom element
│       ├── src/
│       │   ├── branch-indicator.ts     # HTMLElement subclass, Shadow DOM
│       │   └── index.ts
│       ├── package.json
│       └── tsup.config.ts
├── apps/
│   └── storybook/                      # the demo + docs Storybook (React renderer)
│       ├── stories/
│       │   ├── 01-Shapes.stories.tsx
│       │   ├── 02-Sizes.stories.tsx
│       │   ├── 03-Colors.stories.tsx
│       │   ├── 04-Customization.stories.tsx
│       │   ├── 05-Integration.stories.tsx
│       │   └── 06-WebComponent.stories.tsx     # mounts <branch-indicator> via useEffect
│       ├── stories/_shared.ts                  # reused argTypes
│       ├── .storybook/
│       │   ├── main.ts                         # framework: '@storybook/react-vite'
│       │   ├── preview.ts                      # mswLoader, autodocs tag, viteFinal base
│       │   └── manager.ts
│       ├── public/
│       │   └── mockServiceWorker.js            # via `npx msw init public/`
│       └── package.json
├── examples/                                   # backend reference impls
│   ├── express/server.js                       # ~16 LOC — copied from voicepool
│   ├── fastapi/app.py                          # ~15 LOC
│   ├── flask/app.py                            # ~15 LOC
│   └── go/main.go                              # ~25 LOC
├── .github/workflows/
│   ├── ci.yml                                  # type-check + build + test on PR
│   ├── publish.yml                             # tag v* → publish to npm
│   └── pages.yml                               # main → deploy Storybook to Pages
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md                                # Keep-a-Changelog
├── LICENSE                                     # MIT
├── package.json                                # workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .gitignore
```

## Code refactoring (what changes from current voicepool source)

Audit grounded in actual current code at `/Users/mbp2019/Projects/voicepool/frontend/src/components/BranchIndicator.tsx`:

### Bugs/quirks to fix during extraction

1. **`bar` shape ignores `markerSize`** — hardcodes `width: 2`. Either honor `markerSize` for height *and* use it as the bar's thickness scale, or document explicitly. Fix: thickness scales with size (`width: max(2, size/4)`, `height: size * 1.6`).
2. **`icon` shape uses literal `⎇`** — renders inconsistently across fonts. Add an `"svg"` shape that ships a real inline SVG git-branch icon. Keep `"icon"` for users who want the Unicode look. Default flips from `icon` → `svg` for cross-font reliability.
3. **No AbortController on fetch** — replace local `cancelled` flag pattern with proper `AbortController.abort()` on unmount/dep change. Defensive but proper.
4. **Express endpoint path assumption** — voicepool's handler does `path.resolve(process.cwd(), "..")` because the API runs from `api/`. The reference example must NOT inherit that — it'll be `process.cwd()` (whatever the app's cwd is). Document that consumers may need to override.

### New: split data from UI

```ts
// packages/react/src/useBranchInfo.ts
export function useBranchInfo(opts?: { endpoint?: string; pollMs?: number }): {
  branch: string | null;
  kind: BranchKind;
  loading: boolean;
  error: Error | null;
};
```

`BranchIndicator` becomes a presenter on top. Lets consumers build custom UIs without re-implementing fetch/poll.

### Public surface

```ts
// packages/react/src/index.ts
export { default as BranchIndicator } from "./BranchIndicator";
export { useBranchInfo } from "./useBranchInfo";
export {
  classify,
  defaultClassify,
  DEFAULT_COLORS,
} from "@<NAME>/core";
export type {
  BranchKind,
  BranchShape,
  BranchIndicatorProps,
} from "./types";
```

### Default classify: extend safely

Add `release/*` → `main` (protected), `hotfix/*` → `fix`, `chore/*` → `other`. Keep override option.

### Production hiding (NEW)

The indicator is a development tool — it must NOT render in production builds by default. Detection logic lives in `core/env.ts`:

```ts
export function isProductionEnv(): boolean {
  // process.env.NODE_ENV is statically replaced at build time by Vite, Webpack,
  // esbuild, Next.js, and CRA — so this branch is dead-code-eliminated in
  // production builds.
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    return true;
  }
  return false;
}
```

Component prop:

```ts
/**
 * Visibility override:
 * - undefined (default): hidden in production, shown in development
 * - true: always shown (e.g. internal staging dashboards)
 * - false: never shown
 */
enabled?: boolean;
```

Decision matrix:

| `enabled` | NODE_ENV | Result |
|---|---|---|
| undefined | development | render |
| undefined | production | hide |
| true | any | render |
| false | any | hide |

Web Component mirrors via `enabled="true"` / `enabled="false"` attribute.

This keeps the 80% case zero-config (drop in, it auto-hides in prod) while leaving an explicit override for the 20% (staging dashboards, internal-only prod, etc.).

### `"use client"` directive

Top of `BranchIndicator.tsx`:
```ts
"use client";
```

tsup config:
```ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  banner: { js: '"use client";' },
  external: ["react", "react-dom"],
});
```

**Verification step in CI**: grep dist files for `"use client"` at top — most common silent ship bug.

### `package.json` exports (canonical 2026 pattern)

```json
{
  "name": "<NAME>",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": {
        "import": "./dist/index.d.ts",
        "require": "./dist/index.d.cts"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist"],
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

## Vanilla Web Component

Custom element registered as `<branch-indicator>`. Mirrors the React API as HTML attributes:

```html
<branch-indicator
  endpoint="/api/dev/git-branch"
  shape="led"
  marker-size="8"
  poll-ms="0"
  icon-only="false"
></branch-indicator>
```

Uses Shadow DOM with `:host` styles so external CSS doesn't leak in, but exposes `::part(marker)` and `::part(label)` so consumers can style internals.

Color override via either:
- Attribute: `colors='{"main":"#ff0066"}'` (JSON-encoded)
- CSS custom properties on the host: `--branch-main: #ff0066;`

The CSS-property path is preferred — feels native to the platform and matches the host-design-token philosophy.

Internally imports `classify` and `DEFAULT_COLORS` from `packages/core` (workspace dep).

## Storybook (single config, React renderer)

### Setup

```bash
cd apps/storybook
npx storybook@latest init --type react
# or: npm create storybook@latest -- --features docs test a11y
```

`.storybook/main.ts`:
```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../stories/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-docs',     // autodocs + MDX
    '@storybook/addon-a11y',     // standard for component libs
  ],
  staticDirs: ['../public'],     // for mockServiceWorker.js
  typescript: {
    reactDocgen: 'react-docgen-typescript', // TS unions → control options
  },
};
export default config;
```

`.storybook/preview.ts`:
```ts
import type { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';

initialize();

const preview: Preview = {
  loaders: [mswLoader],
  tags: ['autodocs'],   // every story file gets a Docs page
  parameters: {
    layout: 'centered',
  },
};
export default preview;
```

One-time setup: `npx msw init public/ --save` (vendors `mockServiceWorker.js`).

### Stories

1. **`01-Shapes.stories.tsx`** — one story per shape (`Dot`, `Square`, `Led`, `Icon`, `Svg`, `Pill`, `Bar`). All against branch `feat/demo`. Controls: every prop.

2. **`02-Sizes.stories.tsx`** — `Small`, `Medium`, `Large` against the LED shape. `markerSize` rendered as a slider.

3. **`03-Colors.stories.tsx`** — one story per branch kind (`Main`, `Dev`, `Feat`, `Fix`, `Other`) showing default color resolution. Plus `CssVariableTheme` story with a decorator injecting `<style>:root{--color-danger:#ff00aa}</style>` to prove host tokens flow through.

4. **`04-Customization.stories.tsx`**:
   - `CustomColors` — `colors` prop with color-picker controls per kind.
   - `CustomClassify` — uses `mapping` argType to select between preset classifiers (default / strict / fuzzy / custom-epic).
   - `IconOnly` — `iconOnly={true}` toggle.
   - `Polling` — `pollMs=2000`, MSW handler that flips branches every 2s.

5. **`05-Integration.stories.tsx`** — realistic placements:
   - `InHeader`, `InSidebar`, `InsideBadge` (inheritance demo).

6. **`06-WebComponent.stories.tsx`** — wrapper component that mounts `<branch-indicator>` via `useEffect`, passes story args to attributes. Lets WC stories share the same controls as React.

### Shared argTypes

`stories/_shared.ts`:
```ts
import type { ArgTypes } from '@storybook/react-vite';
import { defaultClassify, strictClassify, fuzzyClassify } from '@<NAME>/core';

const SHAPES = ['dot', 'square', 'led', 'icon', 'svg', 'pill', 'bar', 'none'] as const;

export const sharedArgTypes: Partial<ArgTypes> = {
  shape:      { control: 'select', options: SHAPES },
  markerSize: { control: { type: 'range', min: 4, max: 24, step: 1 } },
  iconOnly:   { control: 'boolean' },
  pollMs:     { control: { type: 'number', min: 0, step: 500 } },
  endpoint:   { control: 'text' },
  colors:     { control: 'object' },
  classify: {
    control: 'select',
    options: ['default', 'strict', 'fuzzy'],
    mapping: {
      default: defaultClassify,
      strict: strictClassify,
      fuzzy: fuzzyClassify,
    },
  },
};
```

Spread into each story's `meta.argTypes`. Confirms "every story connected to controls".

### MSW per-story

```ts
import { http, HttpResponse } from 'msw';

export const Feat: Story = {
  args: { shape: 'led' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dev/git-branch', () =>
          HttpResponse.json({ branch: 'feat/example' })
        ),
      ],
    },
  },
};
```

## Documentation

### `README.md`

1. Hero — one-line + GIF showing color flips.
2. Why — drop-in adaptation pitch + risk-inverted color philosophy.
3. Quickstart (React) — install + 5-line example.
4. Quickstart (Web Component) — `<script type="module">` + custom element.
5. Backend setup — copy-paste blocks for Express, FastAPI, Flask, Go (links to `examples/`).
6. API — full prop table + WC attribute table.
7. Theming — CSS-variable chain explained, override examples.
8. Headless hook — `useBranchInfo`.
9. Live demo — Storybook URL.
10. Contributing — link to CONTRIBUTING.md.
11. License — MIT.

### `CONTRIBUTING.md`

Local dev: `pnpm install`, `pnpm storybook`, `pnpm test`, `pnpm build`. Commit conventions (Conventional Commits). PR checklist.

### `CHANGELOG.md`

Keep-a-Changelog format. First entry: `0.1.0 — Initial release`.

## CI/CD

### `.github/workflows/ci.yml`
On PR + push to main:
- Setup Node 22, pnpm
- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test` (Vitest unit tests for `classify`, `useBranchInfo`)
- `pnpm storybook:build` (smoke test stories compile)
- **Verify `"use client"` survives**: `grep -l '"use client"' packages/react/dist/index.{js,cjs}` — fail if missing.

### `.github/workflows/publish.yml`
On tag `v*`:
- All of CI
- `pnpm publish --filter ./packages/react --access public`
- `pnpm publish --filter ./packages/web-component --access public`
- Auto-create GitHub Release from tag, body extracted from CHANGELOG.

Requires `NPM_TOKEN` secret.

### `.github/workflows/pages.yml`
On push to main:
```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm --filter storybook build-storybook -- --output-dir ./storybook-static --quiet --disable-telemetry
- uses: actions/configure-pages@v5
- uses: actions/upload-pages-artifact@v3
  with: { path: ./apps/storybook/storybook-static }
- uses: actions/deploy-pages@v4
```

Storybook's default relative asset paths work at any GitHub Pages subpath without `base` config.

## Backend reference implementations

Each ~15 LOC, copy-paste-ready. Pattern: shell out to `git rev-parse --abbrev-ref HEAD`, return `{branch}` on success, `{branch: null}` on any failure.

- **`examples/express/server.js`** — Lifted from voicepool's `api/src/index.ts` handler. Generalize the `path.resolve(process.cwd(), "..")` hop to just `process.cwd()` so users aren't surprised.
- **`examples/fastapi/app.py`** — `subprocess.run(..., timeout=2)`.
- **`examples/flask/app.py`** — Same as FastAPI, Flask routing.
- **`examples/go/main.go`** — `net/http` + `os/exec`.

Each example dir gets a one-line README explaining run instructions.

## Migration in voicepool

After publish:

1. `cd /Users/mbp2019/Projects/voicepool/frontend && pnpm add <NAME>` (or npm if voicepool stays on npm).
2. Replace import in `frontend/src/App.tsx`:
   ```diff
   - import BranchIndicator from "./components/BranchIndicator";
   + import { BranchIndicator } from "<NAME>";
   ```
3. Delete `frontend/src/components/BranchIndicator.tsx`.
4. Backend endpoint at `api/src/index.ts` stays — server-side stays bespoke, only the client component is shared. (Could later be replaced with the published example, but no rush.)

Proves the package works against a real consumer.

## Critical files (current voicepool source to harvest)

| File | Use as |
|---|---|
| `frontend/src/components/BranchIndicator.tsx` | Starting point for `packages/react/src/BranchIndicator.tsx`. Split fetch into `useBranchInfo`, fix bar/icon quirks, add `"use client"`, wire AbortController. |
| `api/src/index.ts` `/api/dev/git-branch` handler | Source for `examples/express/server.js`. Drop the `path.resolve(cwd, "..")` hop. |
| `frontend/src/App.tsx` (line 127 BranchIndicator usage) | First migration target post-publish; also a real-world example for README. |
| Pattern Archive's `branchColorVar` (`/Users/mbp2019/Projects/PatternArchive/frontend/src/components/layout/sidebarHelpers.ts`) | Reference for the locked color scheme — same risk-inverted logic. |

## Verification

Pre-publish (locally):
1. `pnpm install && pnpm build` — both packages produce ESM + CJS + d.ts.
2. **`grep '"use client"' packages/react/dist/index.{js,cjs}` returns matches** (silent-bug guard).
3. `pnpm storybook` — every story renders, every control works, MSW handlers respond.
4. `pnpm test` — Vitest unit tests pass for `classify` (covers all branch patterns) and `useBranchInfo` (mocked fetch with MSW).
5. Manual: `pnpm pack --filter ./packages/react` → `npm install ./<NAME>-0.1.0.tgz` in voicepool's frontend → confirm BranchIndicator renders identically.

Post-publish (CI):
1. Push tag `v0.1.0` → `publish.yml` runs → both packages on npm.
2. `npm install <NAME>` from a fresh dir works.
3. Storybook URL on GitHub Pages renders correctly.
4. Replace voicepool's local `BranchIndicator.tsx` with the package import → identical render in voicepool's header.

Failure-path checks:
- Endpoint returns 500 → component renders nothing (silent-fail behavior).
- Endpoint 404 → renders nothing.
- Network unreachable → renders nothing.
- Custom `classify` that throws → caught, falls back to `other`.

## Audit findings (research → plan corrections)

What changed after auditing my first pass against current voicepool code and April-2026 ecosystem reality:

1. **Storybook 8/9 → Storybook 10.3.5.** I assumed older majors. v10 is ESM-only and requires Node 20.16+/22.19+/24+. `@storybook/addon-essentials` is dead — install only `@storybook/addon-docs` + `@storybook/addon-a11y`.
2. **Two Storybooks → one Storybook (React renderer).** Storybook's framework field is singular — can't host React + Web Component renderers together. Single config with WC stories that mount `<branch-indicator>` via wrapper. Trade-off documented.
3. **`"use client"` directive added.** Required for Next.js app router consumers. Most common silent ship bug — added an explicit CI grep step to guard.
4. **peerDeps narrowed: `^18 || ^19`.** Drops React 17 (EOL for hooks-modern usage); not worth the constraint on new libraries.
5. **Internal `packages/core` workspace package.** Path aliases break at publish; relative cross-package imports break tsup. Workspace dep is canonical.
6. **`actions/deploy-pages@v4`, not the bitovi action** linked from Storybook's older docs.
7. **Naming filter:** drop `gitpulse` (multiple existing products). Shortlist: `branch-pulse`, `branchstamp`, `branch-beacon`.
8. **Bar shape and icon shape quirks** noted as fixes during extraction.
9. **MSW v2 + `msw-storybook-addon@2.0.7`** — `http.get` not `rest.get`; do not add the addon to `addons[]`, only use `mswLoader`.
10. **`typescript.reactDocgen: 'react-docgen-typescript'`** — needed for TS literal-union → autodocs control inference.

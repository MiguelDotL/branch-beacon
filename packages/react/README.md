# branch-beacon

A friendly little git branch indicator that lives in the corner of your dev client. It's color-coded, so working branches feel safe and protected ones **stand out**. Adapts to your project's design tokens automatically; hidden in production by default.

![branch-beacon in a header](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/hero-in-header.png)

```tsx
import { BranchIndicator } from "branch-beacon";

<BranchIndicator />
```

That's it. The component fetches the current branch from `/api/dev/git-branch`, classifies it (`main` / `dev` / `feat/*` / `fix/*` / other), picks a color from the host project's CSS variables (or sensible fallbacks), and renders an inline SVG marker plus the branch name. In production builds, it renders nothing.

## Why

Working in a multi-branch repo means losing track of which branch your local dev server is showing. A branch indicator in the corner of your UI fixes that — but every project re-builds the same widget from scratch. branch-beacon is the widget, plus the small backend handler, packaged once.

**Risk-inverted color philosophy**: protected branches (`main`, `master`, `release/*`) render in alarming colors so accidentally pointing at production *looks* alarming. Working branches (`feat/*`, `fix/*`) look safe.

## Install

```bash
npm install branch-beacon
```

For the vanilla Web Component variant (Vue / Svelte / Astro / plain HTML): [`branch-beacon-element`](https://www.npmjs.com/package/branch-beacon-element).

## Quick start

```tsx
import { BranchIndicator } from "branch-beacon";

export function Header() {
  return (
    <header>
      <BranchIndicator />
    </header>
  );
}
```

Defaults: SVG marker, default classifier, default colors, no polling, `/api/dev/git-branch` endpoint, hidden in production.

## Customization

```tsx
<BranchIndicator
  shape="dot"
  glow
  markerSize={10}
  colors={{ main: "var(--my-danger)" }}
  pollMs={30_000}
  className="text-xs uppercase"
/>
```

`glow` works on every shape — `drop-shadow` follows the visible pixels, even on SVG. Tune the radius via `--branch-glow`. Pass any node to `icon` to override the default glyph entirely:

```tsx
<BranchIndicator icon={<MyLogo width={12} height={12} />} />
```

| `shape` | Render |
|---|---|
| `"svg"` (default) | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/shape-svg.png) |
| `"icon"` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/shape-icon.png) |
| `"dot"` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/shape-dot.png) |
| `"led"` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/shape-led.png) |
| `"pill"` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/shape-pill.png) |

### Risk-inverted color palette

| Pattern | Kind | Sample |
|---|---|---|
| `main`, `master`, `release/*` | `main` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/color-main.png) |
| `dev`, `develop` | `dev` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/color-dev.png) |
| `feat/*` | `feat` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/color-feat.png) |
| `fix/*`, `hotfix/*` | `fix` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/color-fix.png) |
| anything else | `other` | ![](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/color-other.png) |

Full prop reference, theming guide, headless hook (`useBranchInfo`), and live Storybook demo: **[github.com/MiguelDotL/branch-beacon](https://github.com/MiguelDotL/branch-beacon)**

## Backend

The component expects `GET /api/dev/git-branch` to return:

```json
{ "branch": "feat/example" }
```

…or `{ "branch": null }` on any failure. Reference handlers for Express, FastAPI, Flask, and Go are in the [`examples/`](https://github.com/MiguelDotL/branch-beacon/tree/main/examples) directory.

Minimal Express version:

```js
import { spawn } from "node:child_process";

app.get("/api/dev/git-branch", (_req, res) => {
  const child = spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"], { timeout: 2_000 });
  let out = "";
  child.stdout.on("data", (b) => { out += b.toString(); });
  child.on("close", (code) => res.json({ branch: code === 0 ? out.trim() || null : null }));
  child.on("error", () => res.json({ branch: null }));
});
```

## Production

Hidden by default — auto-detected via `process.env.NODE_ENV === "production"` (statically replaced at build time by every mainstream bundler).

```tsx
<BranchIndicator enabled />          // force-show in production (staging dashboards, internal-only deploys)
<BranchIndicator enabled={false} />  // force-hide
```

## License

[MIT](https://github.com/MiguelDotL/branch-beacon/blob/main/LICENSE)

# branch-beacon

A friendly little git branch indicator that lives in the corner of your dev client. It's color-coded, so working branches feel safe and protected ones **stand out**. Adapts to your project's design tokens automatically; hidden in production by default.

![branch-beacon in a header](./assets/hero-in-header.png)

```tsx
import { BranchIndicator } from "branch-beacon";

<BranchIndicator />
```

That's it. The component fetches the current branch from `/api/dev/git-branch`, classifies it (`main` / `dev` / `feat/*` / `fix/*` / other), picks a color from the host project's CSS variables (or sensible fallbacks), and renders an inline SVG marker plus the branch name. In production builds, it renders nothing.

## Why

Working in a multi-branch repo means losing track of which branch your local dev server is showing. A branch indicator in the corner of your UI fixes that — but every project re-builds the same widget from scratch. branch-beacon is the widget, plus the small backend handler, packaged once.

**Risk-inverted color philosophy**: protected branches (`main`, `master`, `release/*`) render in alarming colors so accidentally pointing at production *looks* alarming. Working branches (`feat/*`, `fix/*`) look safe. That's the design.

## Install

```bash
npm install branch-beacon
# or for the vanilla Web Component variant:
npm install branch-beacon-element
```

Backend: paste one of the [reference handlers](./examples) into your dev server. Express, FastAPI, Flask, and Go are provided.

## React

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

### Customization

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

`glow` works on every shape (drop-shadow follows the visible pixels, not the bounding box):

![glow modifier on the SVG marker](./assets/customization-glow.png)

Pass any node to `icon` to override the default glyph entirely:

```tsx
<BranchIndicator icon={<MyLogo width={12} height={12} />} />
```

### Marker shapes

| `shape` | Render |
|---|---|
| `"svg"` (default) | ![](./assets/shape-svg.png) |
| `"icon"` | ![](./assets/shape-icon.png) |
| `"dot"` | ![](./assets/shape-dot.png) |
| `"square"` | ![](./assets/shape-square.png) |
| `"led"` | ![](./assets/shape-led.png) |
| `"bar"` | ![](./assets/shape-bar.png) |
| `"pill"` | ![](./assets/shape-pill.png) |
| `"none"` | ![](./assets/shape-none.png) |

Full prop list:

| Prop | Type | Default | Notes |
|---|---|---|---|
| `endpoint` | `string` | `"/api/dev/git-branch"` | Backend URL |
| `shape` | `"svg" \| "icon" \| "dot" \| "square" \| "led" \| "bar" \| "pill" \| "none"` | `"svg"` | `"led"` is a preset for `dot` + `glow` |
| `markerSize` | `number` | `8` | Pixel size for geometric markers |
| `glow` | `boolean` | `false` | Apply CSS `drop-shadow` to the marker; tune via `--branch-glow` |
| `icon` | `ReactNode` | — | Override the default glyph; `shape` is ignored when set |
| `iconOnly` | `boolean` | `false` | Hide the branch label |
| `colors` | `Partial<Record<BranchKind, string>>` | — | Per-kind overrides; any CSS color string |
| `classify` | `(branch: string) => BranchKind` | `defaultClassify` | Or use `strictClassify` / `fuzzyClassify` |
| `pollMs` | `number` | `0` | `0` = fetch once on mount |
| `enabled` | `boolean \| undefined` | `undefined` | Visibility override (see [Production](#production)) |
| `className` | `string` | — | Wrapper class |
| `style` | `CSSProperties` | — | Inline style override |

### Headless hook

If you want the data without the default UI:

```tsx
import { useBranchInfo } from "branch-beacon";

function MyIndicator() {
  const { branch, kind, loading, error } = useBranchInfo();
  if (!branch) return null;
  return <span data-kind={kind}>{branch}</span>;
}
```

## Web Component

For Vue, Svelte, Astro, or plain HTML:

```html
<script type="module">
  import "branch-beacon-element";
</script>

<branch-indicator></branch-indicator>
```

Attributes mirror the React props (kebab-case where camelCase would otherwise apply):

```html
<branch-indicator
  shape="led"
  marker-size="10"
  poll-ms="30000"
  enabled="true"
  colors='{"main":"#ff0066"}'
></branch-indicator>
```

Color overrides also via CSS custom properties on the host:

```css
branch-indicator {
  --branch-main: #ff0066;
  --branch-dev: #00ccff;
}
```

External styling via `::part`:

```css
branch-indicator::part(marker) { /* ... */ }
branch-indicator::part(label)  { /* ... */ }
```

## Theming

Colors are resolved through nested CSS-variable chains. The browser walks each chain at paint time and picks the first defined token:

```
--branch-main → --color-danger → --color-error → --color-accent-red → --color-rose-400 → #fb7185
```

This means the indicator inherits whatever palette your project already uses:

| If your project defines… | …main resolves to |
|---|---|
| `--branch-main` | your custom token |
| `--color-danger` | your semantic danger color |
| `--color-accent-red` | Pattern Archive style |
| `--color-rose-400` | Tailwind v3 named color |
| (none of the above) | hardcoded `#fb7185` fallback |

Same chain pattern for `dev`, `feat`, `fix`, `other`. Override per-kind via the `colors` prop:

```tsx
<BranchIndicator colors={{ main: "var(--my-token)", feat: "#00ff00" }} />
```

Partial overrides only replace what you specify — keys you skip keep their default chain.

### Branch kinds

The default classifier maps:

| Pattern | Kind | Risk | Default color | Sample |
|---|---|---|---|---|
| `main`, `master`, `release/*` | `main` | highest (protected) | rose | ![](./assets/color-main.png) |
| `dev`, `develop`, `development`, `staging` | `dev` | medium | amber | ![](./assets/color-dev.png) |
| `feat/*` | `feat` | safe iteration | emerald | ![](./assets/color-feat.png) |
| `fix/*`, `hotfix/*` | `fix` | bug work | orange | ![](./assets/color-fix.png) |
| anything else | `other` | neutral | gray | ![](./assets/color-other.png) |

Drop in `strictClassify` (only literal `main`/`dev`/`feat/`/`fix/`) or `fuzzyClassify` (substring match: `production`/`staging`/`feature`/`patch`) if your conventions differ. Or pass your own:

```tsx
<BranchIndicator classify={(branch) => branch.startsWith("epic/") ? "feat" : "other"} />
```

## Production

The indicator is a development tool — it should not render to end users. Detection runs through `process.env.NODE_ENV`, which every mainstream bundler (Vite, Webpack, esbuild, Next.js, CRA) statically replaces at build time:

| `enabled` prop | `NODE_ENV` | Behavior |
|---|---|---|
| `undefined` (default) | `"development"` | render |
| `undefined` (default) | `"production"` | **render nothing** |
| `true` | any | render |
| `false` | any | render nothing |

Force the indicator to show in production (e.g. on internal staging dashboards) with `enabled={true}`:

```tsx
<BranchIndicator enabled />
```

When auto-hidden, the entire component subtree is skipped — no fetch is made.

## Backend

The component expects `GET <endpoint>` to return:

```json
{ "branch": "feat/example" }
```

…or `{ "branch": null }` on any failure. Reference handlers live in [`examples/`](./examples) for Express, FastAPI, Flask, and Go.

The minimal pattern (Express):

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

## Live demo

[branch-beacon Storybook](https://miguellozano.github.io/branch-beacon/) — every shape, size, color, and customization knob, fully interactive.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs welcome.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) — see [CONTRIBUTING.md#commit-conventions](./CONTRIBUTING.md#commit-conventions) for the prefix list.

## License

[MIT](./LICENSE)

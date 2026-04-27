# branch-beacon-element

Vanilla Web Component version of [branch-beacon](https://www.npmjs.com/package/branch-beacon). Drop-in `<branch-indicator>` custom element for any framework or plain HTML.

![branch-beacon in a header](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/hero-in-header.png)

```html
<script type="module">
  import "branch-beacon-element";
</script>

<branch-indicator></branch-indicator>
```

That's it. The element fetches the current branch from `/api/dev/git-branch`, classifies it (`main` / `dev` / `feat/*` / `fix/*` / other), picks a color from the host project's CSS variables (or sensible fallbacks), and renders a Shadow-DOM-isolated indicator. In production builds, it renders nothing.

## Install

```bash
npm install branch-beacon-element
```

For React, use [`branch-beacon`](https://www.npmjs.com/package/branch-beacon) instead.

## Attributes

```html
<branch-indicator
  endpoint="/api/dev/git-branch"
  shape="led"
  marker-size="10"
  poll-ms="30000"
  enabled="true"
  colors='{"main":"#ff0066"}'
></branch-indicator>
```

Full attribute reference, theming guide (CSS custom properties, `::part()`), and live Storybook demo: **[github.com/MiguelDotL/branch-beacon](https://github.com/MiguelDotL/branch-beacon)**

## Theming via CSS custom properties

```css
branch-indicator {
  --branch-main: #ff0066;
  --branch-dev: #00ccff;
}
```

The default color tokens are nested `var()` chains that fall through to the host project's existing palette tokens (`--color-danger`, `--color-success`, `--color-rose-400`, etc.) — drop in and it picks up your design tokens automatically.

## External styling via `::part`

```css
branch-indicator::part(marker) { /* ... */ }
branch-indicator::part(label)  { /* ... */ }
```

## Production

Hidden by default — auto-detected via `process.env.NODE_ENV === "production"`.

```html
<branch-indicator enabled="true"></branch-indicator>   <!-- force-show -->
<branch-indicator enabled="false"></branch-indicator>  <!-- force-hide -->
```

## License

[MIT](https://github.com/MiguelDotL/branch-beacon/blob/main/LICENSE)

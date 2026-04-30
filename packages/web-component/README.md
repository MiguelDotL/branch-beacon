# branch-beacon-element

A friendly little git branch indicator that lives in the corner of your dev client. It's color-coded, so working branches feel safe and protected ones **stand out**. Vanilla Web Component (`<branch-beacon>`) for any framework or plain HTML — see [`branch-beacon`](https://www.npmjs.com/package/branch-beacon) for the React variant.

![branch-beacon in a header](https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/hero-in-header.png)

```html
<script type="module">
  import "branch-beacon-element";
</script>

<branch-beacon></branch-beacon>
```

That's it. The element fetches the current branch from `/api/dev/git-branch`, classifies it (`main` / `dev` / `feat/*` / `fix/*` / other), picks a color from the host project's CSS variables (or sensible fallbacks), and renders a Shadow-DOM-isolated indicator. In production builds, it renders nothing.

## Install

```bash
npm install branch-beacon-element
```

For React, use [`branch-beacon`](https://www.npmjs.com/package/branch-beacon) instead.

## Attributes

```html
<branch-beacon
  endpoint="/api/dev/git-branch"
  shape="dot"
  marker-size="10"
  glow
  poll-ms="30000"
  enabled="true"
  colors='{"main":"#ff0066"}'
></branch-beacon>
```

`glow` (boolean attribute) applies a CSS `drop-shadow` to the marker — works on every shape including the inline SVG glyph. Tune the radius via `--branch-glow`.

### Custom icon

Project content into the `icon` slot to replace the built-in glyph entirely:

```html
<branch-beacon>
  <svg slot="icon" viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
    <!-- your icon here -->
  </svg>
</branch-beacon>
```

`shape` is ignored when slotted content is present; `glow` and color theming still apply.

Full attribute reference, theming guide (CSS custom properties, `::part()`), and live Storybook demo: **[github.com/MiguelDotL/branch-beacon](https://github.com/MiguelDotL/branch-beacon)**

## Theming via CSS custom properties

```css
branch-beacon {
  --branch-main: #ff0066;
  --branch-dev: #00ccff;
}
```

The default color tokens are nested `var()` chains that fall through to the host project's existing palette tokens (`--color-danger`, `--color-success`, `--color-rose-400`, etc.) — drop in and it picks up your design tokens automatically.

## External styling via `::part`

```css
branch-beacon::part(marker) { /* ... */ }
branch-beacon::part(label)  { /* ... */ }
```

## Production

Hidden by default — auto-detected via `process.env.NODE_ENV === "production"`.

```html
<branch-beacon enabled="true"></branch-beacon>   <!-- force-show -->
<branch-beacon enabled="false"></branch-beacon>  <!-- force-hide -->
```

## License

[MIT](https://github.com/MiguelDotL/branch-beacon/blob/main/LICENSE)

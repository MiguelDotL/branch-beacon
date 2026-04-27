# Session handoff — branch-beacon screenshots

> Pick up here when you open a new Claude session inside `/Users/mbp2019/Projects/branch-beacon/`.

## Current state (locked-in, do not redo)

- **Repo**: https://github.com/MiguelDotL/branch-beacon — public, on `main`, fully scaffolded.
- **npm**:
  - https://www.npmjs.com/package/branch-beacon (`^0.1.0`, React, 16 KB tarball)
  - https://www.npmjs.com/package/branch-beacon-element (`^0.1.0`, Web Component, 14 KB tarball)
- **Token & secrets**: `NPM_TOKEN` set as repo secret with bypass-2FA enabled. Local `~/.npmrc` has the same token. Tag-driven publish workflow is wired and ready (`.github/workflows/publish.yml`).
- **CI**: `.github/workflows/ci.yml` (typecheck/build/test/verify-use-client), `.github/workflows/pages.yml` (Storybook → GitHub Pages on push to main). Pages will deploy on next push.
- **Tests**: 80/80 pass across `core`, `react`, `web-component`. Run with `pnpm test`.
- **Build**: `pnpm build` produces dist/. `pnpm verify-use-client` confirms the directive survives bundling.
- **Storybook**: 6 story files, every prop wired to a control, MSW mocks the endpoint. Setup is complete — `npx msw init public/ --save` was already run inside `apps/storybook/`.
- **Voicepool consumes the published package** as `branch-beacon: ^0.1.0`. Already migrated, committed on `feat/tts-phase-1`. Do not touch voicepool from this session.

## Goals of next session

### Already done in the previous session (do not redo)

- ✅ **Screenshots captured.** 19 PNGs in `assets/` covering hero (in styled header), every shape, every color kind, two customization showcases, two integration placements. Capture script at `scripts/capture-screenshots.mjs` — re-run with `pnpm storybook` running.
- ✅ **READMEs updated.** Root and both per-package READMEs embed the assets. npm READMEs use `https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/...` so images render on npm pages.
- ✅ **Storybook preview.ts bug fixed.** `process is not defined` browser error eliminated — `apps/storybook/.storybook/preview.ts` no longer assigns `process.env.NODE_ENV`.
- ✅ **Versions bumped to `0.1.1`** in both packages. `CHANGELOG.md` has the entry.

### Remaining work

**Track 1 — security hygiene (15 min, see "Token rotation" section below)**
Swap the bootstrap "All packages" npm token for a narrower one scoped to just `branch-beacon` + `branch-beacon-element`. The current token was needed because granular tokens can't reference unpublished packages; now that both are live, narrow it.

**Track 2 — publish v0.1.1**
Tag and push `v0.1.1`. The publish workflow runs CI + builds + publishes both packages to npm.
```
cd /Users/mbp2019/Projects/branch-beacon
git tag v0.1.1
git push origin v0.1.1
gh run watch -R MiguelDotL/branch-beacon  # follow the publish workflow
```

**Track 3 — GitHub social preview**
- Open https://github.com/MiguelDotL/branch-beacon/settings#social-preview
- Upload an image (recommended: a wider variant of the hero shot, 1280×640).
- The current `assets/hero-in-header.png` is too narrow/short — generate a dedicated one. Add a `social-preview` story in `apps/storybook/stories/` that renders the indicator on a 1280×640 composition (centered, with the project name + tagline), then add it to `scripts/capture-screenshots.mjs` with a `clip` option in the screenshot call.

**Track 4 — optional polish**
- Compose a "shapes grid" or "colors strip" image that combines the individual shots into one frame (use `sharp` if you want to do this in-process, or just lay out a Storybook story that renders all shapes at once).
- Pages workflow may have already deployed Storybook — check `gh run list -R MiguelDotL/branch-beacon --workflow pages.yml`. If green, add the live Storybook URL to the README hero row.

## Approach

1. **Boot Storybook locally**: `pnpm storybook` — runs on http://localhost:6006.
2. **Use Playwright** (already a dev dep transitively, or `pnpm add -D playwright -w`) to write a screenshot script at `scripts/capture-screenshots.mjs`.
3. The script iterates Storybook stories via direct URL (`?path=/story/...&viewMode=story`) which renders just the component without the Storybook chrome. Each shot uses a transparent background or a dark-themed wrapper.
4. Save PNGs to `assets/`. Use 2× device-pixel-ratio for crisp display on retina (`deviceScaleFactor: 2`).
5. Compose the shapes grid manually — 8 separate captures concatenated into a 4×2 grid via Sharp, OR build a single Storybook story that renders all 8 shapes laid out, then capture once.

**Recommended**: build a "showcase" story that renders the grid you want, screenshot once. Cleaner than image stitching and self-documenting.

## Files already updated with assets

- ✅ Root `README.md` — hero shot at top, shape table, colors table.
- ✅ `packages/react/README.md` — hero shot, shape table, colors table (using absolute GitHub URLs for npm).
- ✅ `packages/web-component/README.md` — hero shot.

If you regenerate or rename screenshots, the React + WC READMEs reference paths like:

```
https://raw.githubusercontent.com/MiguelDotL/branch-beacon/main/assets/<file>.png
```

These resolve once the assets are committed and pushed to `main` — that's why the npm READMEs use absolute URLs while the root README can use relative paths.

## Republish to npm

The npm package pages only update their README on a fresh publish. After updating READMEs:

1. Bump `packages/react/package.json` and `packages/web-component/package.json` to `0.1.1`.
2. Update `CHANGELOG.md` with a `0.1.1 — Visual assets in README` entry.
3. Commit + push to main.
4. Tag and push: `git tag v0.1.1 && git push origin v0.1.1`. The `publish.yml` workflow handles the rest.

Or local manual publish if the workflow is acting up:
```
pnpm build
pnpm --filter branch-beacon publish --access public --no-git-checks
pnpm --filter branch-beacon-element publish --access public --no-git-checks
```

## Reference points

- **Plan & engineering quality bar**: `PLAN.md` at repo root.
- **Risk-inverted color philosophy**: `packages/core/src/colors.ts` and the README's "Theming" section.
- **Voicepool's actual usage** (good real-world reference for the hero shot composition): `/Users/mbp2019/Projects/voicepool/frontend/src/App.tsx` line ~127. The header has the cyan accent + monospace styling that suits the indicator's aesthetic.
- **Octicon git-branch path** (used in the SVG marker shape): `packages/react/src/markers.tsx` line ~17.

## Token rotation: narrow the npm token to just these two packages

The current `NPM_TOKEN` (in `~/.npmrc` and as a repo secret) was generated with **"All packages"** scope as a bootstrap, because `branch-beacon` and `branch-beacon-element` didn't exist on the registry yet — granular tokens can't reference packages that don't exist. Now that both packages are published and owned by `migueldotl`, swap the token for a narrower one:

1. Visit https://www.npmjs.com/settings/migueldotl/tokens — revoke the existing `branch-beacon-publish` token.
2. **Generate New Token → Granular Access Token**, settings:
   - Name: `branch-beacon-publish` (same name, fine to reuse)
   - Expiration: pick whatever you want (longest is 1 year)
   - Permissions → **Read and write**
   - Packages and scopes → **"Only select packages and scopes"** → add **both** `branch-beacon` and `branch-beacon-element` (the dropdown will now find them since they exist)
   - Organizations → No access
   - **Allow this token to bypass 2FA** → ✅ (separate toggle, easy to miss)
3. Copy the new token, then update both places it's stored:
   ```
   npm config set //registry.npmjs.org/:_authToken="npm_xxx"
   gh secret set NPM_TOKEN -R MiguelDotL/branch-beacon -b "npm_xxx"
   ```
4. Verify the rotation by running a no-op publish dry-run:
   ```
   pnpm --filter branch-beacon publish --access public --dry-run
   ```
   Should report what would be published with no auth error.

This is a defense-in-depth move. The bootstrap token had write access to *any* package you might create under `migueldotl`, which is broader than necessary. The narrowed token can only ever publish these two specific packages.

## Things explicitly NOT to do

- Don't bump major or minor for this — it's a docs-only release. `0.1.1`.
- Don't change runtime behavior. Visual assets only.
- Don't touch voicepool from this session. Its working tree is clean and on `feat/tts-phase-1`.
- Don't regenerate the npm token unless it's rotated/expired — it's in `~/.npmrc` and the repo secret already.
- Don't add new prop or shape to satisfy a screenshot — the API surface is locked at v0.1.

## Quick-start commands

```bash
cd /Users/mbp2019/Projects/branch-beacon

# install (if fresh clone)
pnpm install

# verify everything still works
pnpm typecheck && pnpm test && pnpm build

# run storybook for screenshot capture
pnpm storybook   # open http://localhost:6006

# after assets/*.png exist and READMEs are updated:
git add -A
git commit -m "docs: add hero, shapes grid, colors demo to READMEs"
# bump to 0.1.1, tag, push — see "Republish to npm" above
```

## Open questions for the new session

- Should the hero image be a static screenshot or a short animated GIF / video? GitHub renders MP4 inline; npm shows static images only. If using both, ship static for npm and put the video reference in the GitHub README under a `<details>` block.
- Should the shapes grid include shape labels (`SVG`, `ICON`, …) or be label-free? Labeled is friendlier for first-time readers.
- Background color for hero: dark (matches voicepool aesthetic) or light? Probably dark — matches the dev-tool vibe and shows the colors more vividly.

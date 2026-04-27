// Capture screenshots of every Storybook story for README/npm imagery.
//
// Prereq: Storybook running at http://localhost:6006. Start with:
//   pnpm storybook
//
// Output: assets/<story-id>.png (crisp 2x device-pixel-ratio).
//
// Crop strategy: Storybook's iframe page renders the component in an
// 'centered' layout container — we screenshot the body itself, which
// gives us the centered component on a clean background. For the
// "InHeader" / "InSidebar" / "InsideBadge" integration stories we let
// the wrapper render at full width.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "assets");

const STORYBOOK_URL = "http://localhost:6006";
const VIEWPORT = { width: 1280, height: 720 };

// Stories worth shipping as docs imagery. Each entry has:
//   - file:    output filename
//   - id:      Storybook story id
//   - selector: optional CSS selector to crop to. Defaults to the indicator's
//               outer wrapper (tight crop). Use "header"/"aside" for
//               integration stories where the wrapper is the interesting frame.
const SHOTS = [
  // Hero shot — branch indicator inside a styled header (most representative)
  { file: "hero-in-header.png", id: "branchindicator-05-integration--in-header", selector: "header" },
  { file: "hero-svg.png", id: "branchindicator-01-shapes--svg" },

  // Shape variants — tight crops, suitable for inline embedding
  { file: "shape-svg.png", id: "branchindicator-01-shapes--svg" },
  { file: "shape-icon.png", id: "branchindicator-01-shapes--icon" },
  { file: "shape-dot.png", id: "branchindicator-01-shapes--dot" },
  { file: "shape-square.png", id: "branchindicator-01-shapes--square" },
  { file: "shape-led.png", id: "branchindicator-01-shapes--led" },
  { file: "shape-bar.png", id: "branchindicator-01-shapes--bar" },
  { file: "shape-pill.png", id: "branchindicator-01-shapes--pill" },
  { file: "shape-none.png", id: "branchindicator-01-shapes--no-marker" },

  // Color palette — risk-inverted scheme
  { file: "color-main.png", id: "branchindicator-03-colors--main" },
  { file: "color-dev.png", id: "branchindicator-03-colors--dev" },
  { file: "color-feat.png", id: "branchindicator-03-colors--feat" },
  { file: "color-fix.png", id: "branchindicator-03-colors--fix" },
  { file: "color-other.png", id: "branchindicator-03-colors--other" },

  // Customization showcases
  { file: "customization-colors.png", id: "branchindicator-04-customization--custom-colors" },
  { file: "customization-icon-only.png", id: "branchindicator-04-customization--icon-only" },

  // Realistic placements
  { file: "placement-sidebar.png", id: "branchindicator-05-integration--in-sidebar", selector: "aside" },
  { file: "placement-badge.png", id: "branchindicator-05-integration--inside-badge" },
];

const iframeUrl = (id) =>
  `${STORYBOOK_URL}/iframe.html?args=&id=${encodeURIComponent(id)}&viewMode=story`;

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
});
const page = await context.newPage();

let captured = 0;
let skipped = 0;

for (const shot of SHOTS) {
  const url = iframeUrl(shot.id);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15_000 });
    // Wait for the indicator's title attribute to appear — that means
    // the MSW handler resolved and the component finished rendering.
    await page.waitForSelector('[title^="Current git branch"]', {
      timeout: 8_000,
    });
    // A small settle so glow / transitions finish.
    await page.waitForTimeout(150);

    const outPath = resolve(OUT_DIR, shot.file);
    // Default crop: the indicator itself. Override with `selector` to
    // capture a host wrapper (header / sidebar / badge) instead.
    const targetSelector = shot.selector ?? '[title^="Current git branch"]';
    const target = page.locator(targetSelector).first();
    await target.screenshot({
      path: outPath,
      // Wrappers (header/aside) keep their backgrounds; tight indicator
      // shots come out transparent so they sit cleanly on README backgrounds.
      omitBackground: !shot.selector,
    });
    console.log(`✓ ${shot.file}`);
    captured += 1;
  } catch (err) {
    console.warn(`× ${shot.file} — ${err.message.split("\n")[0]}`);
    skipped += 1;
  }
}

await browser.close();
console.log(`\nDone. Captured ${captured}, skipped ${skipped}. Output: ${OUT_DIR}`);

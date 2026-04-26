import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { BranchShape } from "@branch-beacon/core";
import { renderMarker } from "./markers.js";

const renderShape = (shape: BranchShape, size = 8): string =>
  renderToStaticMarkup(<>{renderMarker(shape, size)}</>);

describe("renderMarker", () => {
  it("returns null for shapes without a separate marker", () => {
    expect(renderMarker("pill", 8)).toBeNull();
    expect(renderMarker("none", 8)).toBeNull();
  });

  it.each<BranchShape>(["dot", "square", "led", "bar", "icon", "svg"])(
    "renders something for shape %s",
    (shape) => {
      const html = renderShape(shape);
      expect(html.length).toBeGreaterThan(0);
    },
  );

  it("dot has 50% border-radius (circle)", () => {
    const html = renderShape("dot");
    expect(html).toContain("border-radius:50%");
  });

  it("led has a glow box-shadow", () => {
    const html = renderShape("led");
    expect(html).toContain("box-shadow");
    expect(html).toContain("currentColor");
  });

  it("bar scales thickness with size", () => {
    // size=20 → width = max(2, 5) = 5
    const html = renderShape("bar", 20);
    expect(html).toContain("width:5px");
  });

  it("svg uses fill=currentColor for color inheritance", () => {
    const html = renderShape("svg");
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain("<path");
  });

  it("icon renders the unicode glyph", () => {
    const html = renderShape("icon");
    expect(html).toContain("⎇");
  });

  it("respects size argument for square/dot/svg", () => {
    expect(renderShape("dot", 16)).toMatch(/width:16px/);
    expect(renderShape("square", 16)).toMatch(/width:16px/);
    expect(renderShape("svg", 16)).toMatch(/width="16"/);
  });
});

import { describe, expect, it } from "vitest";
import { DEFAULT_COLORS, colorFor } from "./colors.js";
import type { BranchKind } from "./types.js";

describe("DEFAULT_COLORS", () => {
  const kinds: BranchKind[] = ["main", "dev", "feat", "fix", "other"];

  it("has an entry for every BranchKind", () => {
    for (const kind of kinds) {
      expect(DEFAULT_COLORS[kind]).toBeTypeOf("string");
      expect(DEFAULT_COLORS[kind].length).toBeGreaterThan(0);
    }
  });

  it("each default ends in a hex fallback so it always resolves", () => {
    // Every chain should bottom out on a #-prefixed color so the indicator
    // works in projects with zero CSS-variable theme setup.
    for (const kind of kinds) {
      expect(DEFAULT_COLORS[kind]).toMatch(/#[0-9a-fA-F]{3,8}\)*$/);
    }
  });

  it("each default uses var() chain so host tokens flow through", () => {
    for (const kind of kinds) {
      expect(DEFAULT_COLORS[kind]).toMatch(/^var\(--branch-/);
    }
  });
});

describe("colorFor", () => {
  it("returns the default chain when no overrides are passed", () => {
    expect(colorFor("main")).toBe(DEFAULT_COLORS.main);
    expect(colorFor("feat")).toBe(DEFAULT_COLORS.feat);
  });

  it("returns the override when one is provided for the kind", () => {
    expect(colorFor("main", { main: "#ff0066" })).toBe("#ff0066");
  });

  it("only overrides the kinds explicitly provided", () => {
    const overrides = { main: "#ff0066" };
    expect(colorFor("main", overrides)).toBe("#ff0066");
    expect(colorFor("feat", overrides)).toBe(DEFAULT_COLORS.feat);
  });

  it("ignores undefined override values", () => {
    expect(colorFor("main", { main: undefined })).toBe(DEFAULT_COLORS.main);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { isProductionEnv, shouldRender } from "./env.js";

describe("isProductionEnv", () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("returns true when NODE_ENV is 'production'", () => {
    process.env.NODE_ENV = "production";
    expect(isProductionEnv()).toBe(true);
  });

  it("returns false when NODE_ENV is 'development'", () => {
    process.env.NODE_ENV = "development";
    expect(isProductionEnv()).toBe(false);
  });

  it("returns false when NODE_ENV is 'test'", () => {
    process.env.NODE_ENV = "test";
    expect(isProductionEnv()).toBe(false);
  });

  it("returns false when process is undefined", () => {
    const stub = vi.stubGlobal("process", undefined);
    expect(isProductionEnv()).toBe(false);
    stub.restoreAll?.();
  });
});

describe("shouldRender", () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("returns true when enabled is explicitly true (even in production)", () => {
    process.env.NODE_ENV = "production";
    expect(shouldRender(true)).toBe(true);
  });

  it("returns false when enabled is explicitly false (even in development)", () => {
    process.env.NODE_ENV = "development";
    expect(shouldRender(false)).toBe(false);
  });

  it("auto-hides when enabled is undefined and NODE_ENV is production", () => {
    process.env.NODE_ENV = "production";
    expect(shouldRender(undefined)).toBe(false);
  });

  it("auto-shows when enabled is undefined and NODE_ENV is not production", () => {
    process.env.NODE_ENV = "development";
    expect(shouldRender(undefined)).toBe(true);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { isProductionEnv, shouldRender } from "./env.js";

const originalNodeEnv = (
  globalThis as { process?: { env?: { NODE_ENV?: string } } }
).process?.env?.NODE_ENV;
const originalProcess = (globalThis as { process?: unknown }).process;

const setNodeEnv = (value: string | undefined) => {
  const proc = (globalThis as { process?: { env?: Record<string, string> } })
    .process;
  if (proc?.env) {
    if (value === undefined) delete proc.env.NODE_ENV;
    else proc.env.NODE_ENV = value;
  }
};

afterEach(() => {
  // Restore process for the next test even if a test stubbed it to undefined.
  (globalThis as { process?: unknown }).process = originalProcess;
  setNodeEnv(originalNodeEnv);
});

describe("isProductionEnv", () => {
  it("returns true when NODE_ENV is 'production'", () => {
    setNodeEnv("production");
    expect(isProductionEnv()).toBe(true);
  });

  it("returns false when NODE_ENV is 'development'", () => {
    setNodeEnv("development");
    expect(isProductionEnv()).toBe(false);
  });

  it("returns false when NODE_ENV is 'test'", () => {
    setNodeEnv("test");
    expect(isProductionEnv()).toBe(false);
  });

  it("returns false when process is undefined on globalThis", () => {
    (globalThis as { process?: unknown }).process = undefined;
    expect(isProductionEnv()).toBe(false);
  });
});

describe("shouldRender", () => {
  it("returns true when enabled is explicitly true (even in production)", () => {
    setNodeEnv("production");
    expect(shouldRender(true)).toBe(true);
  });

  it("returns false when enabled is explicitly false (even in development)", () => {
    setNodeEnv("development");
    expect(shouldRender(false)).toBe(false);
  });

  it("auto-hides when enabled is undefined and NODE_ENV is production", () => {
    setNodeEnv("production");
    expect(shouldRender(undefined)).toBe(false);
  });

  it("auto-shows when enabled is undefined and NODE_ENV is not production", () => {
    setNodeEnv("development");
    expect(shouldRender(undefined)).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BranchIndicator } from "./BranchIndicator.js";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ branch: "feat/integration" }),
    } as Response),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<BranchIndicator />", () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("renders the branch name in dev", async () => {
    process.env.NODE_ENV = "development";
    render(<BranchIndicator />);
    expect(await screen.findByText("feat/integration")).toBeDefined();
  });

  it("hides in production by default", async () => {
    process.env.NODE_ENV = "production";
    const { container } = render(<BranchIndicator />);
    // No need to wait — env-gate is checked synchronously before render path.
    expect(container.firstChild).toBeNull();
  });

  it("shows in production when enabled={true}", async () => {
    process.env.NODE_ENV = "production";
    render(<BranchIndicator enabled />);
    expect(await screen.findByText("feat/integration")).toBeDefined();
  });

  it("hides in development when enabled={false}", () => {
    process.env.NODE_ENV = "development";
    const { container } = render(<BranchIndicator enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("hides the label when iconOnly={true}", async () => {
    process.env.NODE_ENV = "development";
    render(<BranchIndicator iconOnly />);
    await waitFor(() => {
      expect(screen.queryByText("feat/integration")).toBeNull();
    });
  });

  it("applies the resolved color via inline style", async () => {
    process.env.NODE_ENV = "development";
    const { container } = render(<BranchIndicator />);
    await waitFor(() => screen.getByText("feat/integration"));
    const wrapper = container.querySelector("span");
    expect(wrapper?.getAttribute("style")).toMatch(/color:\s*var\(--branch-feat/);
  });
});

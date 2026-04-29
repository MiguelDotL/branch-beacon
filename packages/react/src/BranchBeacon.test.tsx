import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BranchBeacon, BranchIndicator } from "./index.js";

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

describe("<BranchBeacon />", () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("renders the branch name in dev", async () => {
    process.env.NODE_ENV = "development";
    render(<BranchBeacon />);
    expect(await screen.findByText("feat/integration")).toBeDefined();
  });

  it("hides in production by default", async () => {
    process.env.NODE_ENV = "production";
    const { container } = render(<BranchBeacon />);
    // No need to wait — env-gate is checked synchronously before render path.
    expect(container.firstChild).toBeNull();
  });

  it("shows in production when enabled={true}", async () => {
    process.env.NODE_ENV = "production";
    render(<BranchBeacon enabled />);
    expect(await screen.findByText("feat/integration")).toBeDefined();
  });

  it("hides in development when enabled={false}", () => {
    process.env.NODE_ENV = "development";
    const { container } = render(<BranchBeacon enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("hides the label when iconOnly={true}", async () => {
    process.env.NODE_ENV = "development";
    render(<BranchBeacon iconOnly />);
    await waitFor(() => {
      expect(screen.queryByText("feat/integration")).toBeNull();
    });
  });

  it("applies the resolved color via inline style", async () => {
    process.env.NODE_ENV = "development";
    const { container } = render(<BranchBeacon />);
    await waitFor(() => screen.getByText("feat/integration"));
    const wrapper = container.querySelector("span");
    expect(wrapper?.getAttribute("style")).toMatch(/color:\s*var\(--branch-feat/);
  });

  it("applies drop-shadow filter when glow={true}", async () => {
    process.env.NODE_ENV = "development";
    const { container } = render(<BranchBeacon shape="dot" glow />);
    await waitFor(() => screen.getByText("feat/integration"));
    expect(container.innerHTML).toContain("drop-shadow");
  });

  it("renders the icon prop instead of the built-in shape", async () => {
    process.env.NODE_ENV = "development";
    render(
      <BranchBeacon
        icon={<span data-testid="custom-icon">★</span>}
        shape="svg"
      />,
    );
    await waitFor(() => screen.getByText("feat/integration"));
    expect(screen.getByTestId("custom-icon")).toBeDefined();
    // No SVG path from the default marker should be present.
    expect(document.querySelector("svg path")).toBeNull();
  });

  it("BranchIndicator alias resolves to BranchBeacon", () => {
    expect(BranchIndicator).toBe(BranchBeacon);
  });
});

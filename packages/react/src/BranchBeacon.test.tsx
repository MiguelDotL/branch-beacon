import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BranchBeacon } from "./index.js";

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
});

// ---------------------------------------------------------------
// Container-width-aware compact mode
// ---------------------------------------------------------------

// Minimal ResizeObserver fake. Each instance exposes a `trigger(width)`
// helper so tests can drive contentBoxSize updates without depending on
// real layout. Captured via a registry keyed on the observed target so
// tests can find the right instance even when components mount/unmount.
type FakeRO = {
  observed: Element | null;
  trigger: (width: number) => void;
  disconnect: () => void;
  unobserve: (el: Element) => void;
};

const observers: FakeRO[] = [];

class FakeResizeObserver {
  private cb: ResizeObserverCallback;
  private observed: Element | null = null;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    const handle: FakeRO = {
      get observed() {
        return self.observed;
      },
      trigger: (width: number) => {
        if (!self.observed) return;
        const entry = {
          target: self.observed,
          contentRect: { width } as DOMRectReadOnly,
          contentBoxSize: [{ inlineSize: width, blockSize: 0 }],
          borderBoxSize: [{ inlineSize: width, blockSize: 0 }],
          devicePixelContentBoxSize: [{ inlineSize: width, blockSize: 0 }],
        } as unknown as ResizeObserverEntry;
        self.cb([entry], self as unknown as ResizeObserver);
      },
      disconnect: () => {
        self.observed = null;
      },
      unobserve: () => {
        self.observed = null;
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    observers.push(handle);
  }
  observe(el: Element) {
    this.observed = el;
  }
  unobserve() {
    this.observed = null;
  }
  disconnect() {
    this.observed = null;
  }
}

// Set the parent's getBoundingClientRect width so the synchronous
// initial read matches the test's intent before the observer fires.
const stubRectWidth = (el: Element, width: number) => {
  el.getBoundingClientRect = () =>
    ({
      width,
      height: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
};

const lastObserver = (): FakeRO => {
  const o = observers.at(-1);
  if (!o) throw new Error("no ResizeObserver instance registered");
  return o;
};

describe("<BranchBeacon /> compact mode", () => {
  const original = process.env.NODE_ENV;

  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("collapses to icon-only when the parent is below the default 80px threshold", async () => {
    process.env.NODE_ENV = "development";
    render(
      <div data-testid="parent" style={{ width: 60 }}>
        <BranchBeacon />
      </div>,
    );
    const parent = screen.getByTestId("parent");
    stubRectWidth(parent, 60);
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    lastObserver().trigger(60);
    await waitFor(() => {
      expect(screen.queryByText("feat/integration")).toBeNull();
    });
  });

  it("shows the label when the parent is above the threshold", async () => {
    process.env.NODE_ENV = "development";
    render(
      <div data-testid="parent" style={{ width: 400 }}>
        <BranchBeacon />
      </div>,
    );
    const parent = screen.getByTestId("parent");
    stubRectWidth(parent, 400);
    await screen.findByText("feat/integration");
    lastObserver().trigger(400);
    expect(screen.getByText("feat/integration")).toBeDefined();
  });

  it("flips back to full when the parent grows past the threshold", async () => {
    process.env.NODE_ENV = "development";
    render(
      <div data-testid="parent">
        <BranchBeacon />
      </div>,
    );
    const parent = screen.getByTestId("parent");
    stubRectWidth(parent, 60);
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    lastObserver().trigger(60);
    await waitFor(() => {
      expect(screen.queryByText("feat/integration")).toBeNull();
    });
    lastObserver().trigger(400);
    await screen.findByText("feat/integration");
  });

  it("respects a custom compactBelow threshold", async () => {
    process.env.NODE_ENV = "development";
    render(
      <div data-testid="parent">
        <BranchBeacon compactBelow={200} />
      </div>,
    );
    const parent = screen.getByTestId("parent");
    stubRectWidth(parent, 150);
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    lastObserver().trigger(150);
    await waitFor(() => {
      expect(screen.queryByText("feat/integration")).toBeNull();
    });
  });

  it("does not create a ResizeObserver when compactBelow={false}", async () => {
    process.env.NODE_ENV = "development";
    render(
      <div>
        <BranchBeacon compactBelow={false} />
      </div>,
    );
    await screen.findByText("feat/integration");
    expect(observers.length).toBe(0);
  });

  it("treats width 0 as unknown and leaves state untouched", async () => {
    process.env.NODE_ENV = "development";
    render(
      <div data-testid="parent">
        <BranchBeacon />
      </div>,
    );
    await screen.findByText("feat/integration");
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    lastObserver().trigger(0);
    // Still showing — width 0 should not collapse.
    expect(screen.getByText("feat/integration")).toBeDefined();
  });

  it("observes containerRef.current when provided instead of the parent", async () => {
    process.env.NODE_ENV = "development";
    const ref = createRef<HTMLDivElement>();
    const Wrapper = () => (
      <div>
        <div ref={ref} data-testid="custom-container" style={{ width: 50 }} />
        <div style={{ width: 999 }}>
          <BranchBeacon containerRef={ref} />
        </div>
      </div>
    );
    render(<Wrapper />);
    const target = screen.getByTestId("custom-container");
    stubRectWidth(target, 50);
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    // Confirm the ref target is the one being observed, not the parent.
    expect(lastObserver().observed).toBe(target);
    lastObserver().trigger(50);
    await waitFor(() => {
      expect(screen.queryByText("feat/integration")).toBeNull();
    });
  });

  it("falls back to svg when shape='none' in compact mode without a custom icon", async () => {
    process.env.NODE_ENV = "development";
    const { container } = render(
      <div data-testid="parent">
        <BranchBeacon shape="none" />
      </div>,
    );
    const parent = screen.getByTestId("parent");
    stubRectWidth(parent, 40);
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    lastObserver().trigger(40);
    await waitFor(() => {
      expect(container.querySelector("svg")).not.toBeNull();
    });
  });

  it("does not throw when ResizeObserver is undefined (SSR-like runtime)", async () => {
    process.env.NODE_ENV = "development";
    vi.stubGlobal("ResizeObserver", undefined);
    expect(() =>
      render(
        <div>
          <BranchBeacon />
        </div>,
      ),
    ).not.toThrow();
    await screen.findByText("feat/integration");
  });
});

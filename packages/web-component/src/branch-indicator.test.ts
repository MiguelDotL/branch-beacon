import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineBranchBeacon } from "./branch-indicator.js";

defineBranchBeacon();

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ branch: "feat/wc-test" }),
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  document.body.replaceChildren();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

const mount = (attrs: Record<string, string> = {}): HTMLElement => {
  const el = document.createElement("branch-beacon");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.replaceChildren(el);
  return el;
};

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("<branch-beacon>", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("registers on the customElements registry", () => {
    expect(customElements.get("branch-beacon")).toBeTruthy();
  });

  it("renders the branch label in dev", async () => {
    process.env.NODE_ENV = "development";
    const el = mount();
    await flush();
    const label = el.shadowRoot?.querySelector('[part="label"]');
    expect(label?.textContent).toBe("feat/wc-test");
  });

  it("hides via the hidden attribute in production", async () => {
    process.env.NODE_ENV = "production";
    const el = mount();
    await flush();
    expect(el.hasAttribute("hidden")).toBe(true);
  });

  it("force-shows when enabled='true' even in production", async () => {
    process.env.NODE_ENV = "production";
    const el = mount({ enabled: "true" });
    await flush();
    expect(el.hasAttribute("hidden")).toBe(false);
    const label = el.shadowRoot?.querySelector('[part="label"]');
    expect(label?.textContent).toBe("feat/wc-test");
  });

  it("hides via attribute when enabled='false' even in dev", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ enabled: "false" });
    await flush();
    expect(el.hasAttribute("hidden")).toBe(true);
  });

  it("renders an SVG marker by default", async () => {
    process.env.NODE_ENV = "development";
    const el = mount();
    await flush();
    const svg = el.shadowRoot?.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("led shape renders round with glow filter on the marker host", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ shape: "led" });
    await flush();
    const marker = el.shadowRoot?.querySelector('[part="marker"]') as HTMLElement;
    expect(marker?.style.filter).toMatch(/drop-shadow/);
    expect(marker?.style.filter).toMatch(/currentColor/);
    // The fallback default marker is round (border-radius 50%).
    const slot = marker.querySelector("slot") as HTMLSlotElement;
    const fallback = slot.firstElementChild as HTMLElement;
    expect(fallback.style.borderRadius).toBe("50%");
  });

  it("applies glow filter when the glow attribute is present", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ shape: "dot", glow: "" });
    await flush();
    const marker = el.shadowRoot?.querySelector('[part="marker"]') as HTMLElement;
    expect(marker?.style.filter).toMatch(/drop-shadow/);
  });

  it("does not apply glow filter when the attribute is absent", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ shape: "dot" });
    await flush();
    const marker = el.shadowRoot?.querySelector('[part="marker"]') as HTMLElement;
    expect(marker?.style.filter).toBe("");
  });

  it("renders content slotted into the icon slot", async () => {
    process.env.NODE_ENV = "development";
    const el = document.createElement("branch-beacon");
    const userIcon = document.createElement("span");
    userIcon.setAttribute("slot", "icon");
    userIcon.setAttribute("data-testid", "custom-icon");
    userIcon.textContent = "★";
    el.append(userIcon);
    document.body.replaceChildren(el);
    await flush();
    // The slotted node is in light DOM, queryable from the host.
    expect(el.querySelector('[data-testid="custom-icon"]')).toBeTruthy();
  });

  it("hides the label when icon-only is set", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ "icon-only": "" });
    await flush();
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    expect(label?.style.display).toBe("none");
  });

  it("uses the configured endpoint", async () => {
    process.env.NODE_ENV = "development";
    mount({ endpoint: "/git" });
    await flush();
    expect(fetchMock).toHaveBeenCalledWith("/git", expect.any(Object));
  });

  it("applies a per-kind color override via colors attribute", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ colors: '{"feat":"#abcdef"}' });
    await flush();
    expect(el.style.color).toBe("rgb(171, 205, 239)");
  });
});

// ---------------------------------------------------------------
// Container-width-aware compact mode (web component)
// ---------------------------------------------------------------

type FakeRO = {
  observed: Element | null;
  trigger: (width: number) => void;
};
const observers: FakeRO[] = [];

class FakeResizeObserver {
  private cb: ResizeObserverCallback;
  private observed: Element | null = null;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    observers.push({
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
    });
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

describe("<branch-beacon> compact mode", () => {
  const original = process.env.NODE_ENV;

  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  const mountInParent = (
    parentWidth: number,
    attrs: Record<string, string> = {},
  ): { el: HTMLElement; parent: HTMLElement } => {
    const parent = document.createElement("div");
    parent.style.width = `${parentWidth}px`;
    stubRectWidth(parent, parentWidth);
    const el = document.createElement("branch-beacon");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    parent.append(el);
    document.body.replaceChildren(parent);
    return { el, parent };
  };

  it("hides the label when the parent is below the default 80px threshold", async () => {
    process.env.NODE_ENV = "development";
    const { el } = mountInParent(60);
    await flush();
    lastObserver().trigger(60);
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    expect(label.style.display).toBe("none");
  });

  it("shows the label when the parent is above the threshold", async () => {
    process.env.NODE_ENV = "development";
    const { el } = mountInParent(400);
    await flush();
    lastObserver().trigger(400);
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    expect(label.style.display).not.toBe("none");
    expect(label.textContent).toBe("feat/wc-test");
  });

  it("flips back to full when the parent grows past the threshold", async () => {
    process.env.NODE_ENV = "development";
    const { el } = mountInParent(60);
    await flush();
    lastObserver().trigger(60);
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    expect(label.style.display).toBe("none");
    lastObserver().trigger(400);
    expect(label.style.display).not.toBe("none");
  });

  it("respects a custom compact-below threshold", async () => {
    process.env.NODE_ENV = "development";
    const { el } = mountInParent(150, { "compact-below": "200" });
    await flush();
    lastObserver().trigger(150);
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    expect(label.style.display).toBe("none");
  });

  it("does not create a ResizeObserver when compact-below='false'", async () => {
    process.env.NODE_ENV = "development";
    mountInParent(40, { "compact-below": "false" });
    await flush();
    expect(observers.length).toBe(0);
  });

  it("treats width 0 as unknown and leaves state untouched", async () => {
    process.env.NODE_ENV = "development";
    const { el } = mountInParent(400);
    await flush();
    lastObserver().trigger(0);
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    // Still showing the label — width 0 must not collapse.
    expect(label.style.display).not.toBe("none");
  });

  it("observes the container property override instead of the parent", async () => {
    process.env.NODE_ENV = "development";
    const customTarget = document.createElement("div");
    stubRectWidth(customTarget, 50);
    document.body.append(customTarget);

    const parent = document.createElement("div");
    parent.style.width = "999px";
    stubRectWidth(parent, 999);
    const el = document.createElement("branch-beacon") as HTMLElement & {
      container: Element | null;
    };
    parent.append(el);
    document.body.append(parent);

    el.container = customTarget;
    await flush();

    expect(lastObserver().observed).toBe(customTarget);
    lastObserver().trigger(50);
    const label = el.shadowRoot?.querySelector('[part="label"]') as HTMLElement;
    expect(label.style.display).toBe("none");
  });

  it("falls back to svg marker when shape='none' in compact mode", async () => {
    process.env.NODE_ENV = "development";
    const { el } = mountInParent(40, { shape: "none" });
    await flush();
    lastObserver().trigger(40);
    const svg = el.shadowRoot?.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("does not throw when ResizeObserver is undefined", async () => {
    process.env.NODE_ENV = "development";
    vi.stubGlobal("ResizeObserver", undefined);
    expect(() => mountInParent(40)).not.toThrow();
    await flush();
  });
});

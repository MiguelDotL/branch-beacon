import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineBranchIndicator } from "./branch-indicator.js";

defineBranchIndicator();

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
  const el = document.createElement("branch-indicator");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.replaceChildren(el);
  return el;
};

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("<branch-indicator>", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("registers on the customElements registry", () => {
    expect(customElements.get("branch-indicator")).toBeTruthy();
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

  it("respects the shape attribute", async () => {
    process.env.NODE_ENV = "development";
    const el = mount({ shape: "led" });
    await flush();
    const marker = el.shadowRoot?.querySelector('[part="marker"]') as HTMLElement;
    expect(marker?.style.boxShadow).toMatch(/currentColor/);
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

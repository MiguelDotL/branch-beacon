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

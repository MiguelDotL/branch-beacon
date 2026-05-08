import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchBeacon } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

/**
 * Container-width-aware compact mode. The beacon collapses to a marker
 * when the container narrows past `compactBelow` (default `80`), and
 * expands back to full when there's room again.
 *
 * The default code path observes `parentElement` automatically — drop
 * `<BranchBeacon />` into a collapsing sidebar and it Just Works. The
 * `containerRef` escape hatch is only needed for fixed-width wrappers
 * or grandparent observation.
 */
const meta = {
  title: "BranchBeacon/08 Compact Mode",
  component: BranchBeacon,
  argTypes: sharedArgTypes,
  args: { shape: "svg", markerSize: 12 },
  parameters: {
    msw: { handlers: [mockBranch("feat/compact-demo")] },
    layout: "fullscreen",
  },
} satisfies Meta<typeof BranchBeacon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sidebar mock with a width slider. Drag below 80px and the beacon
// collapses. Mirrors the real-world "sidebar collapses to icons" pattern.
const ResizableSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [width, setWidth] = useState(220);
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: 24,
        background: "#0b0d11",
        color: "#e5e7eb",
        minHeight: 320,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
    >
      <aside
        style={{
          width,
          padding: 16,
          background: "#111418",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontSize: 12,
          overflow: "hidden",
          transition: "width 120ms ease-out",
        }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ opacity: 0.6 }}>Home</div>
          <div style={{ opacity: 0.6 }}>Projects</div>
          <div style={{ opacity: 0.6 }}>Settings</div>
        </nav>
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 12,
          }}
        >
          {children}
        </div>
      </aside>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          Drag the slider to resize the sidebar. The beacon collapses
          to a marker-only indicator when the sidebar is below the
          <code style={{ padding: "1px 4px", background: "#1f2937", borderRadius: 3, marginLeft: 4 }}>
            compactBelow
          </code>{" "}
          threshold (default <strong>80px</strong>).
        </p>
        <label style={{ display: "block", margin: "16px 0 6px", fontSize: 12, opacity: 0.8 }}>
          Sidebar width: <strong>{width}px</strong>
        </label>
        <input
          type="range"
          min={40}
          max={320}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          style={{ width: 320 }}
        />
      </div>
    </div>
  );
};

/**
 * The default behavior with zero configuration. Slide the sidebar
 * narrower and watch the label vanish below 80px.
 */
export const CollapsingSidebar: Story = {
  render: (args) => (
    <ResizableSidebar>
      <BranchBeacon {...args} />
    </ResizableSidebar>
  ),
};

/**
 * Custom threshold — collapses earlier (below 140px) so the beacon
 * stays roomy in moderately tight space.
 */
export const CustomThreshold: Story = {
  args: { compactBelow: 140 },
  render: (args) => (
    <ResizableSidebar>
      <BranchBeacon {...args} />
    </ResizableSidebar>
  ),
};

/**
 * Opt-out: `compactBelow={false}` disables the observer entirely.
 * The beacon renders the full label regardless of container width.
 */
export const Disabled: Story = {
  args: { compactBelow: false },
  render: (args) => (
    <ResizableSidebar>
      <BranchBeacon {...args} />
    </ResizableSidebar>
  ),
};

/**
 * Escape hatch: `containerRef` points at a different element to
 * observe. Useful when the natural `parentElement` is the wrong
 * thing (fixed-width wrapper, overflow-clipped container,
 * grandparent observation).
 *
 * Here the beacon lives inside a wide inner box but tracks the
 * outer sidebar's width via the ref.
 */
export const ContainerRefOverride: Story = {
  render: (args) => {
    const RefDemo: React.FC = () => {
      const sidebarRef = useRef<HTMLElement | null>(null);
      const [width, setWidth] = useState(220);
      return (
        <div
          style={{
            display: "flex",
            gap: 24,
            padding: 24,
            background: "#0b0d11",
            color: "#e5e7eb",
            minHeight: 320,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          }}
        >
          <aside
            ref={(el) => {
              sidebarRef.current = el;
            }}
            style={{
              width,
              padding: 16,
              background: "#111418",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 12,
              transition: "width 120ms ease-out",
            }}
          >
            <div
              style={{
                width: 600,
                padding: 8,
                background: "#1f2937",
                borderRadius: 4,
                fontSize: 11,
                opacity: 0.85,
              }}
            >
              Inner box is 600px wide (overflows). Beacon below tracks the{" "}
              <strong>aside</strong>, not this inner box.
              <div style={{ marginTop: 8 }}>
                <BranchBeacon {...args} containerRef={sidebarRef} />
              </div>
            </div>
          </aside>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
              Sidebar width: <strong>{width}px</strong>
            </label>
            <input
              type="range"
              min={40}
              max={320}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={{ width: 320 }}
            />
          </div>
        </div>
      );
    };
    return <RefDemo />;
  },
};

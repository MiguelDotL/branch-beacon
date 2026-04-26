import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchIndicator } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

const meta = {
  title: "BranchIndicator/05 Integration",
  component: BranchIndicator,
  argTypes: sharedArgTypes,
  args: { shape: "svg", markerSize: 10 },
  parameters: {
    msw: { handlers: [mockBranch("feat/realistic")] },
    layout: "fullscreen",
  },
} satisfies Meta<typeof BranchIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

const HeaderShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <header
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      background: "#0b0d11",
      color: "#e5e7eb",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 12,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <strong style={{ color: "#f3f4f6" }}>YOUR APP</strong>
      <span style={{ opacity: 0.4 }}>v0.1 · Dashboard</span>
      {children}
    </div>
    <div style={{ display: "flex", gap: 12, opacity: 0.6 }}>
      <span>Settings</span>
      <span>Logs</span>
    </div>
  </header>
);

const SidebarShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside
    style={{
      width: 220,
      height: 360,
      padding: 16,
      background: "#111418",
      color: "#d1d5db",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 12,
    }}
  >
    <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ opacity: 0.6 }}>Home</div>
      <div style={{ opacity: 0.6 }}>Projects</div>
      <div style={{ opacity: 0.6 }}>Settings</div>
    </nav>
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
      {children}
    </div>
  </aside>
);

export const InHeader: Story = {
  render: (args) => (
    <HeaderShell>
      <BranchIndicator {...args} />
    </HeaderShell>
  ),
};

export const InSidebar: Story = {
  render: (args) => (
    <SidebarShell>
      <BranchIndicator {...args} />
    </SidebarShell>
  ),
};

/**
 * Inheritance demo: the host wraps the indicator in a styled badge and
 * its typography (uppercase, letter-spacing) flows through the className,
 * while the indicator imposes only its color.
 */
export const InsideBadge: Story = {
  render: (args) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 6,
        background: "#1f2937",
        color: "#9ca3af",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
      }}
    >
      Branch:&nbsp;
      <BranchIndicator {...args} />
    </span>
  ),
};

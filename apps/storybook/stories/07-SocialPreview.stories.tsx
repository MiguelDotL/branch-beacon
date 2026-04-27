import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchIndicator } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

/**
 * 1280×640 composition for use as the GitHub repo's social-preview image.
 * The capture script clips this story at exactly 1280×640 so the rendered
 * PNG drops straight into Settings → Social preview.
 */
const meta = {
  title: "BranchIndicator/07 Social Preview",
  component: BranchIndicator,
  argTypes: sharedArgTypes,
  args: { shape: "svg", markerSize: 28, glow: true },
  parameters: {
    msw: { handlers: [mockBranch("feat/your-app")] },
    layout: "fullscreen",
  },
} satisfies Meta<typeof BranchIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SocialCard: Story = {
  render: (args) => (
    <div
      data-social-card
      style={{
        width: 1280,
        height: 640,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 28,
        background:
          "radial-gradient(ellipse at center, #182030 0%, #0b0d11 70%)",
        color: "#e5e7eb",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
    >
      <div
        style={{
          fontSize: 64,
          letterSpacing: "0.04em",
          fontWeight: 700,
          color: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <BranchIndicator {...args} />
      </div>
      <div
        style={{
          fontSize: 20,
          color: "#9ca3af",
          maxWidth: 900,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Drop-in git branch indicator. Risk-inverted colors.
        <br />
        React + Web Component. Hidden in production.
      </div>
    </div>
  ),
};

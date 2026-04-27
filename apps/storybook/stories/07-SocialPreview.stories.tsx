import type { ComponentProps } from "react";
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

const SocialCard = (args: ComponentProps<typeof BranchIndicator>) => (
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
        fontSize: 22,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#9ca3af",
      }}
    >
      branch-beacon
    </div>
    <div
      style={{
        fontSize: 20,
        color: "#9ca3af",
        textAlign: "center",
        lineHeight: 1.6,
      }}
    >
      A friendly little git branch indicator for your dev client.
      <br />
      It's color-coded, so working branches feel safe and
      <br />
      protected ones <strong style={{ color: "#f3f4f6" }}>stand out</strong>.
    </div>
  </div>
);

export const SocialCardStory: Story = {
  name: "Social Card",
  render: (args) => <SocialCard {...args} />,
};

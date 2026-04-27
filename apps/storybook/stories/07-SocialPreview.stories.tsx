import type { ComponentProps, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchIndicator } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

/**
 * 1280×640 composition for use as the GitHub repo's social-preview image.
 * Two variants share the layout — `SocialCardWhite` is monochrome,
 * `SocialCardColored` highlights the risk-inverted palette inline.
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

// Hex values mirror the package's default risk-inverted palette so the
// inline highlights read as the same colors the indicator itself uses.
const FEAT_GREEN = "#34d399";
const DEV_AMBER = "#fbbf24";
const MAIN_ROSE = "#fb7185";

const Tagline = ({ colored }: { colored: boolean }): ReactNode => {
  const safe = colored ? (
    <span style={{ color: FEAT_GREEN }}>working branches feel safe</span>
  ) : (
    "working branches feel safe"
  );
  const standOut = colored ? (
    <>
      <span style={{ color: DEV_AMBER }}>protected ones</span>{" "}
      <span style={{ color: MAIN_ROSE }}>stand out</span>
    </>
  ) : (
    "protected ones stand out"
  );
  return (
    <>
      A friendly little git branch indicator
      <br />
      that lives in the corner of your dev client.
      <br />
      It's color-coded, so {safe} and
      <br />
      {standOut}.
    </>
  );
};

const SocialCard = ({
  colored,
  ...args
}: { colored: boolean } & ComponentProps<typeof BranchIndicator>) => (
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
      <Tagline colored={colored} />
    </div>
  </div>
);

export const SocialCardWhite: Story = {
  render: (args) => <SocialCard {...args} colored={false} />,
};

export const SocialCardColored: Story = {
  render: (args) => <SocialCard {...args} colored={true} />,
};

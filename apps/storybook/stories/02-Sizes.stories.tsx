import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchBeacon } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

const meta = {
  title: "BranchBeacon/02 Sizes",
  component: BranchBeacon,
  argTypes: sharedArgTypes,
  args: { shape: "led" },
  parameters: {
    msw: { handlers: [mockBranch("feat/sizes")] },
  },
} satisfies Meta<typeof BranchBeacon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { markerSize: 6 },
};

export const Medium: Story = {
  args: { markerSize: 10 },
};

export const Large: Story = {
  args: { markerSize: 16 },
};

export const ExtraLarge: Story = {
  args: { markerSize: 22 },
};

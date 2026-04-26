import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchIndicator } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

const meta = {
  title: "BranchIndicator/02 Sizes",
  component: BranchIndicator,
  argTypes: sharedArgTypes,
  args: { shape: "led" },
  parameters: {
    msw: { handlers: [mockBranch("feat/sizes")] },
  },
} satisfies Meta<typeof BranchIndicator>;

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

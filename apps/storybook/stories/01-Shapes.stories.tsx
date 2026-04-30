import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchBeacon } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

const meta = {
  title: "BranchBeacon/01 Shapes",
  component: BranchBeacon,
  argTypes: sharedArgTypes,
  args: { markerSize: 8 },
  parameters: {
    msw: { handlers: [mockBranch("feat/demo")] },
  },
} satisfies Meta<typeof BranchBeacon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Svg: Story = {
  args: { shape: "svg" },
};

export const Icon: Story = {
  args: { shape: "icon" },
};

export const Dot: Story = {
  args: { shape: "dot" },
};

export const Square: Story = {
  args: { shape: "square" },
};

export const Led: Story = {
  args: { shape: "led" },
};

export const Bar: Story = {
  args: { shape: "bar" },
};

export const Pill: Story = {
  args: { shape: "pill" },
};

export const NoMarker: Story = {
  args: { shape: "none" },
};

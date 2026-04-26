import type { Meta, StoryObj } from "@storybook/react-vite";
import { BranchIndicator } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

const meta = {
  title: "BranchIndicator/03 Colors",
  component: BranchIndicator,
  argTypes: sharedArgTypes,
  args: { shape: "svg", markerSize: 12 },
} satisfies Meta<typeof BranchIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

// One story per branch kind — each demonstrates the default color resolved
// from the var() chain. Hover shows the branch name in the title.

export const Main: Story = {
  parameters: { msw: { handlers: [mockBranch("main")] } },
};

export const Dev: Story = {
  parameters: { msw: { handlers: [mockBranch("dev")] } },
};

export const Feat: Story = {
  parameters: { msw: { handlers: [mockBranch("feat/example")] } },
};

export const Fix: Story = {
  parameters: { msw: { handlers: [mockBranch("fix/example")] } },
};

export const Other: Story = {
  parameters: { msw: { handlers: [mockBranch("chore/deps")] } },
};

/**
 * Demonstrates host-project CSS variables flowing through the default
 * color chain. The decorator injects `:root { --color-danger: #ff00aa }`
 * into the preview iframe; `main` branch picks it up via var(--branch-main,
 * var(--color-danger, ...))`.
 */
export const CssVariableTheme: Story = {
  decorators: [
    (Story) => (
      <>
        <style>{`
          :root {
            --color-danger: #ff00aa;
            --color-warning: #00ccff;
            --color-success: #ccff00;
          }
        `}</style>
        <Story />
      </>
    ),
  ],
  parameters: { msw: { handlers: [mockBranch("main")] } },
};

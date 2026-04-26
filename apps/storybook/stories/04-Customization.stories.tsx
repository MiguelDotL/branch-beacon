import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { BranchIndicator } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

const meta = {
  title: "BranchIndicator/04 Customization",
  component: BranchIndicator,
  argTypes: sharedArgTypes,
  args: { shape: "svg", markerSize: 10 },
} satisfies Meta<typeof BranchIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomColors: Story = {
  args: {
    colors: {
      main: "#ff0066",
      dev: "#00ccff",
      feat: "#ccff00",
      fix: "#ff8800",
      other: "#888",
    },
  },
  parameters: { msw: { handlers: [mockBranch("feat/themed")] } },
};

export const IconOnly: Story = {
  args: { iconOnly: true, shape: "led" },
  parameters: { msw: { handlers: [mockBranch("feat/icon-only")] } },
};

/**
 * Demonstrates polling: the MSW handler flips between branches every
 * second; the indicator picks up the change on each poll cycle.
 */
export const Polling: Story = {
  args: { pollMs: 1500 },
  parameters: {
    msw: {
      handlers: [
        (() => {
          const branches = ["feat/one", "feat/two", "main", "fix/critical"];
          let i = 0;
          return http.get("/api/dev/git-branch", () => {
            const branch = branches[i % branches.length] ?? "main";
            i += 1;
            return HttpResponse.json({ branch });
          });
        })(),
      ],
    },
  },
};

/**
 * Demonstrates that the indicator hides itself in production. The story
 * uses a small wrapper to force NODE_ENV=production temporarily so the
 * gate's behavior is observable in the preview.
 */
export const HiddenInProduction: Story = {
  args: {},
  parameters: { msw: { handlers: [mockBranch("feat/prod")] } },
  render: (args) => {
    const [hidden, setHidden] = useState(true);
    useEffect(() => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = hidden ? "production" : "development";
      return () => {
        process.env.NODE_ENV = original;
      };
    }, [hidden]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={() => setHidden((v) => !v)}
          style={{ alignSelf: "flex-start", padding: "4px 10px" }}
        >
          Toggle NODE_ENV (currently {hidden ? "production" : "development"})
        </button>
        <BranchIndicator {...args} />
        <small>(empty above when NODE_ENV is production unless `enabled` is set)</small>
      </div>
    );
  },
};

/**
 * Force-show in production. Same toggle as above, but with `enabled={true}`,
 * the indicator renders regardless of NODE_ENV.
 */
export const ForceShowInProduction: Story = {
  args: { enabled: true },
  parameters: { msw: { handlers: [mockBranch("main")] } },
  render: (args) => {
    useEffect(() => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      return () => {
        process.env.NODE_ENV = original;
      };
    }, []);
    return <BranchIndicator {...args} />;
  },
};

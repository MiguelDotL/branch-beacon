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
  args: { iconOnly: true, shape: "svg", markerSize: 20 },
  parameters: { msw: { handlers: [mockBranch("feat/icon-only")] } },
};

/**
 * Custom icon escape hatch — pass any node via the `icon` prop to replace
 * the built-in marker entirely. `shape` is ignored when `icon` is set,
 * but `glow`, `colors`, and the production gate still apply.
 */
export const CustomIcon: Story = {
  args: {
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18 21 L12 16.5 L6 21 L8 13.5 L2 9 L9.5 9 Z" />
      </svg>
    ),
  },
  parameters: { msw: { handlers: [mockBranch("feat/custom-icon")] } },
};

/**
 * Glow modifier — `glow={true}` applies a CSS `drop-shadow` to the
 * marker. Works uniformly across solid shapes (dot/square/bar/led) and
 * outlined glyphs (svg/icon). Tune the radius via `--branch-glow`.
 */
export const Glow: Story = {
  args: { shape: "svg", markerSize: 16, glow: true },
  parameters: { msw: { handlers: [mockBranch("feat/glow")] } },
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

import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import "branch-beacon-element"; // side-effect: registers <branch-indicator>
import type { BranchKind, BranchShape } from "branch-beacon";
import { mockBranch, sharedArgTypes } from "./_shared.js";

interface WebComponentArgs {
  shape: BranchShape;
  markerSize: number;
  iconOnly: boolean;
  pollMs: number;
  endpoint: string;
  enabled: boolean | undefined;
  colors: Partial<Record<BranchKind, string>> | undefined;
}

/**
 * Mounts the `<branch-indicator>` custom element and pipes Storybook
 * args to its attributes via a useEffect. Same controls as the React
 * component thanks to the shared argTypes — proves API parity.
 */
const WebComponentDemo: React.FC<WebComponentArgs> = (args) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("shape", args.shape);
    el.setAttribute("marker-size", String(args.markerSize));
    el.setAttribute("poll-ms", String(args.pollMs));
    el.setAttribute("endpoint", args.endpoint);

    if (args.iconOnly) el.setAttribute("icon-only", "");
    else el.removeAttribute("icon-only");

    if (args.enabled === undefined) el.removeAttribute("enabled");
    else el.setAttribute("enabled", String(args.enabled));

    if (args.colors) el.setAttribute("colors", JSON.stringify(args.colors));
    else el.removeAttribute("colors");
  }, [args]);

  return (
    <branch-indicator
      ref={ref as React.Ref<HTMLElement>}
      style={{
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    />
  );
};

declare global {
  // Lets TS accept <branch-indicator> as JSX without a global type extension.
  namespace JSX {
    interface IntrinsicElements {
      "branch-indicator": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

const meta = {
  title: "WebComponent/<branch-indicator>",
  component: WebComponentDemo,
  argTypes: sharedArgTypes,
  args: {
    shape: "svg",
    markerSize: 10,
    iconOnly: false,
    pollMs: 0,
    endpoint: "/api/dev/git-branch",
    enabled: undefined,
    colors: undefined,
  },
  parameters: {
    msw: { handlers: [mockBranch("feat/web-component")] },
  },
} satisfies Meta<typeof WebComponentDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LedShape: Story = { args: { shape: "led" } };
export const PillShape: Story = { args: { shape: "pill" } };
export const IconOnlyMode: Story = { args: { shape: "led", iconOnly: true } };
export const CustomColors: Story = {
  args: { colors: { feat: "#ccff00", main: "#ff0066" } },
};

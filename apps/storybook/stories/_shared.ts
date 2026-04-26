import { http, HttpResponse } from "msw";
import {
  defaultClassify,
  strictClassify,
  fuzzyClassify,
  type BranchShape,
} from "branch-beacon";

const SHAPES: readonly BranchShape[] = [
  "svg",
  "icon",
  "dot",
  "square",
  "led",
  "bar",
  "pill",
  "none",
] as const;

/**
 * Shared argTypes spread into every story file's meta.argTypes.
 * Every prop on the component has a control here — that's the contract:
 * any story you open lets you tweak any prop live.
 */
export const sharedArgTypes = {
  shape: {
    control: "select" as const,
    options: SHAPES,
    description: "Marker shape rendered alongside the branch label.",
  },
  markerSize: {
    control: { type: "range" as const, min: 4, max: 24, step: 1 },
    description: "Pixel size for geometric markers.",
  },
  iconOnly: {
    control: "boolean" as const,
    description: "Hide the branch text, render the marker only.",
  },
  pollMs: {
    control: { type: "number" as const, min: 0, step: 500 },
    description: "Poll the endpoint every N ms (0 = fetch once).",
  },
  endpoint: {
    control: "text" as const,
    description: "Backend endpoint returning { branch: string | null }.",
  },
  enabled: {
    control: "select" as const,
    options: ["auto", "true", "false"],
    mapping: {
      auto: undefined,
      true: true,
      false: false,
    },
    description:
      "Visibility override. 'auto' = hidden in production. 'true'/'false' force the state.",
  },
  colors: {
    control: "object" as const,
    description: "Override colors per branch kind. Any CSS color string accepted.",
  },
  classify: {
    control: "select" as const,
    options: ["default", "strict", "fuzzy"],
    mapping: {
      default: defaultClassify,
      strict: strictClassify,
      fuzzy: fuzzyClassify,
    },
    description: "Branch-name classifier preset.",
  },
  className: {
    table: { disable: true },
  },
  style: {
    table: { disable: true },
  },
};

/**
 * MSW handler factory. Returns a handler that always responds with the
 * given branch string for the default endpoint.
 */
export const mockBranch = (branch: string | null) =>
  http.get("/api/dev/git-branch", () => HttpResponse.json({ branch }));

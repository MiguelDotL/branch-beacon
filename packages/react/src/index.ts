// Public surface — only the exports below are part of the API contract.
// Adding to this list is a minor version bump; removing or changing
// signatures is a major.

export { BranchIndicator } from "./BranchIndicator.js";
export { useBranchInfo } from "./useBranchInfo.js";

export type {
  BranchIndicatorProps,
  UseBranchInfoOptions,
  BranchInfoResult,
} from "./types.js";

// Re-exports from @branch-beacon/core so consumers don't need a second
// install for the helpers and types most directly tied to the component.
export {
  defaultClassify,
  strictClassify,
  fuzzyClassify,
  DEFAULT_COLORS,
  isProductionEnv,
} from "@branch-beacon/core";

export type {
  BranchKind,
  BranchShape,
  BranchResponse,
  Classifier,
} from "@branch-beacon/core";

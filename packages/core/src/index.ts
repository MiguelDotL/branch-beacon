export type { BranchKind, BranchShape, BranchResponse } from "./types.js";
export type { Classifier } from "./classify.js";

export {
  defaultClassify,
  strictClassify,
  fuzzyClassify,
  classify,
} from "./classify.js";

export { DEFAULT_COLORS, colorFor } from "./colors.js";

export { isProductionEnv, shouldRender } from "./env.js";

export { watchBranch } from "./watch.js";
export type {
  WatchBranchOptions,
  WatchBranchUpdate,
  WatchBranchHandler,
} from "./watch.js";

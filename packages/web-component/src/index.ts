// Public surface for branch-beacon-element.
//
// Side effect: importing this module auto-registers the `<branch-indicator>`
// custom element. To register under a different tag name (e.g. to avoid
// collisions with another library), import `defineBranchIndicator` and call
// it explicitly with the desired tag.

export {
  BranchIndicatorElement,
  defineBranchIndicator,
} from "./branch-indicator.js";

import { defineBranchIndicator } from "./branch-indicator.js";

// Auto-register on import. Idempotent.
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  defineBranchIndicator();
}

// Re-exports from core so consumers can build custom UIs around the same
// helpers without a second install.
export {
  defaultClassify,
  strictClassify,
  fuzzyClassify,
  DEFAULT_COLORS,
  isProductionEnv,
  watchBranch,
} from "@branch-beacon/core";

export type {
  BranchKind,
  BranchShape,
  BranchResponse,
  Classifier,
  WatchBranchOptions,
  WatchBranchUpdate,
  WatchBranchHandler,
} from "@branch-beacon/core";

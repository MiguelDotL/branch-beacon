// Public surface for branch-beacon-element.
//
// Side effect: importing this module auto-registers `<branch-beacon>`.
// To register under a custom tag name, import `defineBranchBeacon` and
// call it explicitly with the desired tag INSTEAD of importing this
// module directly.

export {
  BranchBeaconElement,
  defineBranchBeacon,
} from "./branch-indicator.js";

import { defineBranchBeacon } from "./branch-indicator.js";

// Auto-register on import. Idempotent.
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  defineBranchBeacon();
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

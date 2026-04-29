// Public surface for branch-beacon-element.
//
// Side effect: importing this module auto-registers `<branch-beacon>`.
// To register under a custom tag name (e.g. the legacy `<branch-indicator>`),
// import `defineBranchBeacon` or `defineBranchIndicator` and call it
// explicitly with the desired tag INSTEAD of importing this module directly.

export {
  BranchBeaconElement,
  defineBranchBeacon,
} from "./branch-indicator.js";

/** @deprecated Use BranchBeaconElement instead. Will be removed in v1.0. */
export { BranchIndicatorElement } from "./branch-indicator.js";
/** @deprecated Use defineBranchBeacon instead. Will be removed in v1.0. */
export { defineBranchIndicator } from "./branch-indicator.js";

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

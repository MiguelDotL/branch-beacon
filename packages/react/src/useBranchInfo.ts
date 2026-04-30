import { useEffect, useMemo, useState } from "react";
import {
  classify as classifyGuarded,
  defaultClassify,
  watchBranch,
} from "@branch-beacon/core";
import type { BranchInfoResult, UseBranchInfoOptions } from "./types.js";

const DEFAULT_ENDPOINT = "/api/dev/git-branch";

interface InternalState {
  branch: string | null;
  error: Error | null;
  loading: boolean;
}

const INITIAL_STATE: InternalState = {
  branch: null,
  error: null,
  loading: true,
};

const isSameState = (a: InternalState, b: InternalState): boolean =>
  a.branch === b.branch &&
  a.loading === b.loading &&
  (a.error?.message ?? null) === (b.error?.message ?? null);

/**
 * Headless hook: subscribes to the configured branch endpoint via
 * {@link watchBranch} and exposes `{ branch, kind, loading, error }`.
 *
 * The fetch + polling + abort lifecycle lives in `@branch-beacon/core`'s
 * watcher — this hook is just the React adapter that turns watcher
 * updates into component state, and computes `kind` from the branch.
 *
 * Re-render frugality: state only updates when something actually
 * changed (branch, loading, or error message). Identical poll responses
 * don't trigger re-renders.
 *
 * Use this directly to build a custom UI on top of the same data the
 * `<BranchBeacon />` component uses.
 */
export const useBranchInfo = (
  options: UseBranchInfoOptions = {},
): BranchInfoResult => {
  const {
    endpoint = DEFAULT_ENDPOINT,
    pollMs = 0,
    classify = defaultClassify,
  } = options;

  const [state, setState] = useState<InternalState>(INITIAL_STATE);

  // Effect deps deliberately exclude `classify` — it's a pure derivation
  // applied to the fetched branch, not a fetch input. Including it would
  // tear down the watcher on every render when callers pass an inline fn.
  useEffect(() => {
    const stop = watchBranch({ endpoint, pollMs }, (next) => {
      setState((prev) => (isSameState(prev, next) ? prev : next));
    });
    return stop;
  }, [endpoint, pollMs]);

  const kind = useMemo(
    () =>
      state.branch === null ? "other" : classifyGuarded(classify, state.branch),
    [state.branch, classify],
  );

  return { ...state, kind };
};

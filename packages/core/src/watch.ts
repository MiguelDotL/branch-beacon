import type { BranchResponse } from "./types.js";

/**
 * Configuration for {@link watchBranch}.
 */
export interface WatchBranchOptions {
  /** API endpoint that returns `{ branch: string | null }`. */
  endpoint: string;
  /** Poll interval in ms. `0` means fetch once and stop. */
  pollMs: number;
}

/**
 * Snapshot of the watcher's current view of the world. Delivered to the
 * caller's `onUpdate` handler whenever the watcher learns something new.
 */
export interface WatchBranchUpdate {
  /** The latest branch name from the endpoint, or `null` on any failure. */
  branch: string | null;
  /** The most recent error, if any. `null` after a successful fetch. */
  error: Error | null;
  /** True until the first fetch resolves (success or failure). */
  loading: boolean;
}

/**
 * Receives watcher updates. Called once on initial fetch resolution and
 * again on each subsequent poll.
 */
export type WatchBranchHandler = (update: WatchBranchUpdate) => void;

/**
 * Start watching the configured branch endpoint. Calls `onUpdate` with a
 * fresh snapshot on every fetch resolution.
 *
 * Single source of truth for the fetch + abort + poll lifecycle. Both the
 * React hook and the Web Component delegate to this — no duplication of
 * the network plumbing across consumer packages.
 *
 * Returns a cleanup function that aborts the in-flight request and stops
 * any polling timer. Callers MUST invoke cleanup on unmount/disconnect to
 * avoid leaking timers and pending requests.
 *
 * Failure modes (network, non-2xx, parse error) are reported as
 * `{ branch: null, error: <Error>, loading: false }` — the watcher itself
 * never throws.
 */
export const watchBranch = (
  options: WatchBranchOptions,
  onUpdate: WatchBranchHandler,
): (() => void) => {
  const { endpoint, pollMs } = options;
  const controller = new AbortController();
  let timer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const fetchOnce = async (): Promise<void> => {
    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      if (stopped) return;
      if (!res.ok) {
        onUpdate({
          branch: null,
          error: new Error(`HTTP ${res.status}`),
          loading: false,
        });
        return;
      }
      const data = (await res.json()) as Partial<BranchResponse>;
      if (stopped) return;
      onUpdate({
        branch: data.branch ?? null,
        error: null,
        loading: false,
      });
    } catch (err) {
      if (stopped) return;
      // AbortError on cleanup is expected — silent.
      if (err instanceof Error && err.name === "AbortError") return;
      onUpdate({
        branch: null,
        error: err instanceof Error ? err : new Error(String(err)),
        loading: false,
      });
    }
  };

  void fetchOnce();
  if (pollMs > 0) {
    timer = setInterval(() => {
      void fetchOnce();
    }, pollMs);
  }

  return () => {
    stopped = true;
    controller.abort();
    if (timer !== null) clearInterval(timer);
  };
};

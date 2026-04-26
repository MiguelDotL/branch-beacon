import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchBranch } from "./watch.js";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const ok = (branch: string | null) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ branch }),
  }) as Response;

describe("watchBranch", () => {
  it("delivers an update after the first fetch", async () => {
    fetchMock.mockResolvedValueOnce(ok("feat/foo"));
    const updates: unknown[] = [];

    const stop = watchBranch({ endpoint: "/x", pollMs: 0 }, (u) => updates.push(u));

    await vi.waitFor(() => expect(updates.length).toBe(1));
    expect(updates[0]).toEqual({
      branch: "feat/foo",
      error: null,
      loading: false,
    });
    stop();
  });

  it("delivers null branch and an error on non-2xx", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);
    const updates: unknown[] = [];

    const stop = watchBranch({ endpoint: "/x", pollMs: 0 }, (u) => updates.push(u));

    await vi.waitFor(() => expect(updates.length).toBe(1));
    expect(updates[0]).toMatchObject({
      branch: null,
      loading: false,
    });
    stop();
  });

  it("delivers null branch on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    const updates: { branch: string | null; error: Error | null }[] = [];

    const stop = watchBranch({ endpoint: "/x", pollMs: 0 }, (u) => updates.push(u));

    await vi.waitFor(() => expect(updates.length).toBe(1));
    expect(updates[0]?.branch).toBeNull();
    expect(updates[0]?.error?.message).toBe("boom");
    stop();
  });

  it("polls when pollMs > 0", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(ok("a"))
      .mockResolvedValueOnce(ok("b"))
      .mockResolvedValueOnce(ok("c"));
    const branches: (string | null)[] = [];

    const stop = watchBranch({ endpoint: "/x", pollMs: 1000 }, (u) =>
      branches.push(u.branch),
    );

    await vi.waitFor(() => expect(branches).toEqual(["a"]));
    await vi.advanceTimersByTimeAsync(1000);
    await vi.waitFor(() => expect(branches).toEqual(["a", "b"]));
    await vi.advanceTimersByTimeAsync(1000);
    await vi.waitFor(() => expect(branches).toEqual(["a", "b", "c"]));

    stop();
  });

  it("aborts in-flight fetch when stopped", () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise(() => {
        /* never resolves */
      });
    });

    const stop = watchBranch({ endpoint: "/x", pollMs: 0 }, () => {
      /* */
    });
    stop();
    expect(signal?.aborted).toBe(true);
  });

  it("stops polling after stop() is called", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(ok("a"));

    const stop = watchBranch({ endpoint: "/x", pollMs: 100 }, () => {
      /* */
    });
    await vi.advanceTimersByTimeAsync(50);
    stop();
    await vi.advanceTimersByTimeAsync(500);
    // Initial fetch + zero polls after stop = 1 call.
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

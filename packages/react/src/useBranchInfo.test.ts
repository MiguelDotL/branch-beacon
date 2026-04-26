import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useBranchInfo } from "./useBranchInfo.js";

type FetchMock = ReturnType<typeof vi.fn>;
let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const okResponse = (branch: string | null) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ branch }),
  }) as Response;

describe("useBranchInfo", () => {
  it("fetches the branch on mount", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("feat/test"));

    const { result } = renderHook(() => useBranchInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.branch).toBe("feat/test");
    expect(result.current.kind).toBe("feat");
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dev/git-branch",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("uses the configured endpoint", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("main"));

    renderHook(() => useBranchInfo({ endpoint: "/custom/endpoint" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/custom/endpoint",
        expect.any(Object),
      );
    });
  });

  it("captures errors and renders branch=null", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useBranchInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.branch).toBeNull();
    expect(result.current.error?.message).toBe("network down");
  });

  it("sets branch=null on non-ok HTTP", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() => useBranchInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.branch).toBeNull();
    expect(result.current.error?.message).toBe("HTTP 500");
  });

  it("polls every pollMs ms when pollMs > 0", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchMock
      .mockResolvedValueOnce(okResponse("main"))
      .mockResolvedValueOnce(okResponse("feat/x"))
      .mockResolvedValueOnce(okResponse("feat/y"));

    const { result } = renderHook(() => useBranchInfo({ pollMs: 1000 }));

    await waitFor(() => expect(result.current.branch).toBe("main"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await waitFor(() => expect(result.current.branch).toBe("feat/x"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await waitFor(() => expect(result.current.branch).toBe("feat/y"));
  });

  it("does not poll when pollMs is 0 (default)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchMock.mockResolvedValue(okResponse("main"));

    const { result } = renderHook(() => useBranchInfo());

    await waitFor(() => expect(result.current.branch).toBe("main"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("aborts in-flight fetch on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      // Never-resolving promise simulates an in-flight fetch.
      return new Promise(() => {
        /* */
      });
    });

    const { unmount } = renderHook(() => useBranchInfo());

    // Wait for the effect to fire and call fetch — useEffect runs in a
    // microtask after render, so we must yield before unmount.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("falls back to 'other' kind when branch is null", async () => {
    fetchMock.mockResolvedValueOnce(okResponse(null));

    const { result } = renderHook(() => useBranchInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.branch).toBeNull();
    expect(result.current.kind).toBe("other");
  });
});

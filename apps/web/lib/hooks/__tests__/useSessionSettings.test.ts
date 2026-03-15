import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  getSessionModel,
  getSessionResponseLength,
  useSessionModelSetter,
  useSessionResponseLengthSetter,
} from "../useSessionSettings";

const SESSION_A = "session-abc-123";
const SESSION_B = "session-xyz-456";

function storageKey(sessionId: string) {
  return `conductor:session-settings:${sessionId}`;
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("getSessionModel", () => {
  it("returns the fallback when nothing is stored", () => {
    expect(getSessionModel(SESSION_A, "sonnet")).toBe("sonnet");
  });

  it("returns the stored model when it is a valid ClaudeModel", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ model: "opus" }),
    );
    expect(getSessionModel(SESSION_A, "sonnet")).toBe("opus");
  });

  it("returns the fallback when the stored model is not a valid ClaudeModel", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ model: "gpt-4" }),
    );
    expect(getSessionModel(SESSION_A, "haiku")).toBe("haiku");
  });

  it("returns the fallback when sessionStorage contains corrupt JSON", () => {
    sessionStorage.setItem(storageKey(SESSION_A), "not-json{{{");
    expect(getSessionModel(SESSION_A, "sonnet")).toBe("sonnet");
  });

  it("returns the fallback when the stored model key is missing", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ responseLength: "concise" }),
    );
    expect(getSessionModel(SESSION_A, "opus")).toBe("opus");
  });

  it("is scoped to sessionId — different sessions do not interfere", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ model: "opus" }),
    );
    expect(getSessionModel(SESSION_B, "haiku")).toBe("haiku");
  });

  it("accepts all valid ClaudeModel values", () => {
    for (const model of ["opus", "sonnet", "haiku"] as const) {
      sessionStorage.setItem(storageKey(SESSION_A), JSON.stringify({ model }));
      expect(getSessionModel(SESSION_A, "sonnet")).toBe(model);
    }
  });
});

describe("getSessionResponseLength", () => {
  it("returns the fallback when nothing is stored", () => {
    expect(getSessionResponseLength(SESSION_A, "default")).toBe("default");
  });

  it("returns the stored response length when it is valid", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ responseLength: "concise" }),
    );
    expect(getSessionResponseLength(SESSION_A, "default")).toBe("concise");
  });

  it("returns the fallback when the stored value is not a valid ResponseLength", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ responseLength: "verbose" }),
    );
    expect(getSessionResponseLength(SESSION_A, "detailed")).toBe("detailed");
  });

  it("returns the fallback when sessionStorage contains corrupt JSON", () => {
    sessionStorage.setItem(storageKey(SESSION_A), "}}broken{{");
    expect(getSessionResponseLength(SESSION_A, "concise")).toBe("concise");
  });

  it("accepts all valid ResponseLength values", () => {
    for (const responseLength of ["concise", "default", "detailed"] as const) {
      sessionStorage.setItem(
        storageKey(SESSION_A),
        JSON.stringify({ responseLength }),
      );
      expect(getSessionResponseLength(SESSION_A, "default")).toBe(
        responseLength,
      );
    }
  });

  it("is scoped to sessionId — different sessions do not interfere", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ responseLength: "detailed" }),
    );
    expect(getSessionResponseLength(SESSION_B, "concise")).toBe("concise");
  });
});

describe("useSessionModelSetter", () => {
  it("writes the model to sessionStorage", () => {
    const { result } = renderHook(() => useSessionModelSetter(SESSION_A));
    act(() => result.current("opus"));

    const stored = JSON.parse(
      sessionStorage.getItem(storageKey(SESSION_A)) ?? "{}",
    ) as { model?: string };
    expect(stored.model).toBe("opus");
  });

  it("preserves existing settings when updating model", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ responseLength: "concise" }),
    );

    const { result } = renderHook(() => useSessionModelSetter(SESSION_A));
    act(() => result.current("haiku"));

    const stored = JSON.parse(
      sessionStorage.getItem(storageKey(SESSION_A)) ?? "{}",
    ) as { model?: string; responseLength?: string };
    expect(stored.model).toBe("haiku");
    expect(stored.responseLength).toBe("concise");
  });

  it("overwrites a previously stored model", () => {
    const { result } = renderHook(() => useSessionModelSetter(SESSION_A));
    act(() => result.current("opus"));
    act(() => result.current("sonnet"));

    expect(getSessionModel(SESSION_A, "haiku")).toBe("sonnet");
  });

  it("is scoped to sessionId — does not affect other sessions", () => {
    const { result } = renderHook(() => useSessionModelSetter(SESSION_A));
    act(() => result.current("opus"));

    expect(sessionStorage.getItem(storageKey(SESSION_B))).toBeNull();
  });

  it("returns a stable callback reference across re-renders (same sessionId)", () => {
    const { result, rerender } = renderHook(() =>
      useSessionModelSetter(SESSION_A),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useSessionResponseLengthSetter", () => {
  it("writes the response length to sessionStorage", () => {
    const { result } = renderHook(() =>
      useSessionResponseLengthSetter(SESSION_A),
    );
    act(() => result.current("detailed"));

    const stored = JSON.parse(
      sessionStorage.getItem(storageKey(SESSION_A)) ?? "{}",
    ) as { responseLength?: string };
    expect(stored.responseLength).toBe("detailed");
  });

  it("preserves existing settings when updating response length", () => {
    sessionStorage.setItem(
      storageKey(SESSION_A),
      JSON.stringify({ model: "opus" }),
    );

    const { result } = renderHook(() =>
      useSessionResponseLengthSetter(SESSION_A),
    );
    act(() => result.current("concise"));

    const stored = JSON.parse(
      sessionStorage.getItem(storageKey(SESSION_A)) ?? "{}",
    ) as { model?: string; responseLength?: string };
    expect(stored.responseLength).toBe("concise");
    expect(stored.model).toBe("opus");
  });

  it("overwrites a previously stored response length", () => {
    const { result } = renderHook(() =>
      useSessionResponseLengthSetter(SESSION_A),
    );
    act(() => result.current("concise"));
    act(() => result.current("detailed"));

    expect(getSessionResponseLength(SESSION_A, "default")).toBe("detailed");
  });

  it("returns a stable callback reference across re-renders (same sessionId)", () => {
    const { result, rerender } = renderHook(() =>
      useSessionResponseLengthSetter(SESSION_A),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("storage key format", () => {
  it("uses a namespaced key per session", () => {
    const { result } = renderHook(() => useSessionModelSetter("my-session"));
    act(() => result.current("sonnet"));

    const key = "conductor:session-settings:my-session";
    expect(sessionStorage.getItem(key)).not.toBeNull();
  });
});

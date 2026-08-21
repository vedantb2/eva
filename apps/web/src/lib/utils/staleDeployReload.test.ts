import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  claimStaleDeployReload,
  STALE_DEPLOY_RELOAD_KEY,
} from "./staleDeployReload";

// Regression guard for commit 69092685a ("stop serving HTML for missing JS
// chunks after deploys"). Three listeners reload on a stale deploy — the
// inline one in index.html, vite:preloadError, and the capture-phase error
// listener in main.tsx — and a single broken load can fire several of them.
// This cooldown is the only thing between that and a page that reloads
// forever, so each branch of it is pinned here.

const START = 1_700_000_000_000;
const COOLDOWN_MS = 10_000;

function fakeSessionStorage(initial?: string) {
  const store = new Map<string, string>();
  if (initial !== undefined) store.set(STALE_DEPLOY_RELOAD_KEY, initial);
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("claimStaleDeployReload", () => {
  test("the first claim wins and stamps the shared key", () => {
    const storage = fakeSessionStorage();
    vi.stubGlobal("sessionStorage", storage);

    expect(claimStaleDeployReload()).toBe(true);
    expect(storage.store.get(STALE_DEPLOY_RELOAD_KEY)).toBe(String(START));
  });

  test("a second claim inside the cooldown is refused", () => {
    // Without this, index.html's listener and main.tsx's both reload, and the
    // reloaded page does it again — an endless refresh loop in production.
    vi.stubGlobal("sessionStorage", fakeSessionStorage());

    expect(claimStaleDeployReload()).toBe(true);
    vi.advanceTimersByTime(COOLDOWN_MS - 1);
    expect(claimStaleDeployReload()).toBe(false);
  });

  test("repeated claims inside the cooldown stay refused", () => {
    vi.stubGlobal("sessionStorage", fakeSessionStorage());

    expect(claimStaleDeployReload()).toBe(true);
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(1_000);
      expect(claimStaleDeployReload()).toBe(false);
    }
  });

  test("a claim after the cooldown wins again", () => {
    // A genuinely new deploy later in the session must still be able to
    // reload, so the guard has to expire rather than latch.
    const storage = fakeSessionStorage();
    vi.stubGlobal("sessionStorage", storage);

    expect(claimStaleDeployReload()).toBe(true);
    vi.advanceTimersByTime(COOLDOWN_MS);
    expect(claimStaleDeployReload()).toBe(true);
    expect(storage.store.get(STALE_DEPLOY_RELOAD_KEY)).toBe(
      String(START + COOLDOWN_MS),
    );
  });

  test("an unparseable stamp does not block the reload", () => {
    vi.stubGlobal("sessionStorage", fakeSessionStorage("not-a-timestamp"));

    expect(claimStaleDeployReload()).toBe(true);
  });

  test("sessionStorage being unavailable does not block the reload", () => {
    // Private browsing / blocked storage. Failing closed would leave the user
    // stuck on HTML that can never load its entry module.
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    });

    expect(claimStaleDeployReload()).toBe(true);
  });
});

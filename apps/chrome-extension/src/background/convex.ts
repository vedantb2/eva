import { createClerkClient } from "@clerk/chrome-extension/background";
import { ConvexHttpClient } from "convex/browser";
import type { BgResult } from "../shared/messaging";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const EVA_URL = import.meta.env.VITE_EVA_URL;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}
if (!CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL in environment");
}
if (!EVA_URL) {
  throw new Error("Missing VITE_EVA_URL in environment");
}

/** Thrown when there is no synced Clerk session (user not signed in to Eva). */
class NotSignedInError extends Error {}

/** Thrown when the current page's domain maps to no configured repo. */
export class NoRepoMatchError extends Error {}

type ClerkClient = Awaited<ReturnType<typeof createClerkClient>>;

let clerkPromise: Promise<ClerkClient> | null = null;

/**
 * Lazily creates (and memoises) the background Clerk client. `syncHost` lets
 * it inherit the session from the Eva web app, so the user signs in there and
 * the extension follows. Re-created automatically if the worker restarts.
 */
function getClerk(): Promise<ClerkClient> {
  if (!clerkPromise) {
    clerkPromise = createClerkClient({
      publishableKey: PUBLISHABLE_KEY,
      syncHost: EVA_URL,
    });
  }
  return clerkPromise;
}

// Warm the client at worker start so the first request is faster.
void getClerk();

const convex = new ConvexHttpClient(CONVEX_URL);

/** Creator initials for the signed-in user, e.g. "VB" (falls back to "?"). */
export async function getCreatorInitials(): Promise<string> {
  const clerk = await getClerk();
  const user = clerk.user;
  return (
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?"
  );
}

/**
 * Returns the shared Convex client with a fresh Clerk JWT attached. A new
 * token is fetched per call so it survives token expiry and worker restarts.
 * The `convex` JWT template matches `applicationID: "convex"` in the backend
 * auth config — without it Convex rejects the token.
 */
async function getAuthedClient(): Promise<ConvexHttpClient> {
  const clerk = await getClerk();
  const token = clerk.session
    ? await clerk.session.getToken({ template: "convex" })
    : null;
  if (!token) {
    throw new NotSignedInError("Not signed in to Eva");
  }
  convex.setAuth(token);
  return convex;
}

/**
 * Runs `fn` with an authenticated client and normalises failures into a typed
 * `BgError` so handlers never throw across the message boundary.
 */
export async function withAuth<T extends object>(
  fn: (client: ConvexHttpClient) => Promise<T>,
): Promise<BgResult<T>> {
  try {
    const client = await getAuthedClient();
    const data = await fn(client);
    return { ok: true, ...data };
  } catch (e) {
    if (e instanceof NotSignedInError) {
      return { ok: false, code: "not_signed_in", message: "Sign in to Eva" };
    }
    if (e instanceof NoRepoMatchError) {
      return {
        ok: false,
        code: "no_repo_match",
        message: "No repo mapped to this domain — configure domains in Eva",
      };
    }
    return {
      ok: false,
      code: "convex_error",
      message: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

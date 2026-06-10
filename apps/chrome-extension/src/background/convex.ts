import { createClerkClient } from "@clerk/chrome-extension/background";
import { ConvexHttpClient } from "convex/browser";

type ClerkInstance = Awaited<ReturnType<typeof createClerkClient>>;

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const EVA_URL = import.meta.env.VITE_EVA_URL;

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

let _clerkPromise: Promise<ClerkInstance> | null = null;

function getClerkPromise(): Promise<ClerkInstance> | null {
  if (
    !_clerkPromise &&
    typeof PUBLISHABLE_KEY === "string" &&
    PUBLISHABLE_KEY.length > 0
  ) {
    _clerkPromise = createClerkClient({
      publishableKey: PUBLISHABLE_KEY,
      syncHost: typeof EVA_URL === "string" ? EVA_URL : undefined,
    });
  }
  return _clerkPromise;
}

// Eagerly initialise
getClerkPromise();

const _client = new ConvexHttpClient(String(CONVEX_URL));

export async function getAuthedClient(): Promise<ConvexHttpClient> {
  const clerkPromise = getClerkPromise();
  if (!clerkPromise) throw new NotSignedInError();
  const clerk = await clerkPromise;
  await clerk.load();
  const session = clerk.session;
  if (!session) throw new NotSignedInError();
  const token = await session.getToken({ template: "convex" });
  if (!token) throw new NotSignedInError();
  _client.setAuth(token);
  return _client;
}

export async function getClerkUser(): Promise<{
  firstName: string | null;
  lastName: string | null;
} | null> {
  const clerkPromise = getClerkPromise();
  if (!clerkPromise) return null;
  const clerk = await clerkPromise;
  return clerk.user ?? null;
}

export type { ConvexHttpClient };

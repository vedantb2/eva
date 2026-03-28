# Sandbox Auto-Authentication via Clerk Sign-In Tokens

## Context

Sandbox web previews run on the Daytona proxy domain (e.g., `3000-xxx.proxy.daytona.works`), a different origin from the main app. Browsers don't share cookies cross-origin, so Clerk's `__session` cookie is never sent to the iframe — every request appears unauthenticated. Currently we use `DISABLE_AUTH=true` which bypasses Clerk entirely but loses all user context (Convex queries fail, no user identity).

The user has already created an "Eva" Clerk user and will store its user ID as a system env var via the Admin UI.

## Plan

### 1. Add `generateClerkSignInToken` helper (`packages/backend/convex/daytona.ts`)

Add a function above `createSandbox` that calls Clerk's Backend API directly via `fetch`:

```
POST https://api.clerk.com/v1/sign_in_tokens
Authorization: Bearer <CLERK_SECRET_KEY>
Body: { user_id: <SANDBOX_CLERK_USER_ID> }
Returns: { token: "..." }
```

- Use `String(data.token)` to safely extract the token (avoids `as`/`any`)
- Throw on non-ok response with status + body for debuggability

### 2. Modify `createSandbox` to generate token (`packages/backend/convex/daytona.ts`)

- Read `CLERK_SECRET_KEY` and `SANDBOX_CLERK_USER_ID` from `infraEnvVars`
- If both exist: generate sign-in token, pass as `NEXT_PUBLIC_CLERK_SIGN_IN_TOKEN` env var (`NEXT_PUBLIC_` so the client page can read it at runtime in dev mode)
- If either missing: fall back to `DISABLE_AUTH=true` (backwards compatible)
- Remove the hardcoded `DISABLE_AUTH: "true"` line

### 3. Add `SANDBOX_CLERK_USER_ID` to `REQUIRED_INFRA_KEYS` (`packages/backend/convex/daytona.ts`)

For `process.env` fallback consistency with the other infra keys.

### 4. Add sandbox auth redirect in middleware (`apps/web/middleware.ts`)

- Add `/sandbox-auth` to public routes: `createRouteMatcher(["/api(.*)", "/sandbox-auth"])`
- Replace the simple `await auth.protect()` with:
  1. Call `await auth()` to get `{ userId }` without throwing
  2. If no userId AND `NEXT_PUBLIC_CLERK_SIGN_IN_TOKEN` env var exists AND no `sandbox_auth_attempted` cookie → redirect to `/sandbox-auth?redirect=<original-path>`
  3. If no userId and no token → call `auth.protect()` (normal Clerk flow)
- Keep `DISABLE_AUTH` check as-is for dev environments

### 5. Create `/sandbox-auth` page (`apps/web/app/sandbox-auth/page.tsx`)

New client component:

- Reads token from `process.env.NEXT_PUBLIC_CLERK_SIGN_IN_TOKEN`
- Uses `useSignIn().signIn.create({ strategy: 'ticket', ticket: token })` to exchange token
- Calls `useClerk().setActive({ session: result.createdSessionId })` — Clerk auto-sets `__session` cookie
- Sets `sandbox_auth_attempted=1` cookie (15min TTL) to prevent redirect loops if token is already consumed
- Redirects to `?redirect` param (or `/`)
- On any error, still redirects (graceful degradation)
- Uses `useRef` to prevent double-execution in React Strict Mode

## Flow

```
Sandbox created → Convex generates one-time Clerk sign-in token → passed as env var
                                          ↓
Browser loads iframe → middleware sees no session + token env var
                                          ↓
Redirect to /sandbox-auth?redirect=/original-path
                                          ↓
Client exchanges token → Clerk sets __session cookie → redirect back
                                          ↓
Subsequent requests authenticated as Eva user ✓
```

## Files Changed

| File                                 | Change                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/convex/daytona.ts` | Add `generateClerkSignInToken()`, modify `createSandbox()` to use token instead of `DISABLE_AUTH`, add to `REQUIRED_INFRA_KEYS` |
| `apps/web/middleware.ts`             | Add `/sandbox-auth` to public routes, add sandbox redirect logic                                                                |
| `apps/web/app/sandbox-auth/page.tsx` | **New file.** Client component exchanging token for session                                                                     |

## Edge Cases

- **Missing `SANDBOX_CLERK_USER_ID`**: Falls back to `DISABLE_AUTH=true` — no breakage
- **Token already consumed** (sandbox restart): `sandbox_auth_attempted` cookie prevents redirect loop, app runs unauthenticated
- **Multiple sandboxes**: Each gets its own token, independent sessions, all as Eva user

## Verification

1. Set `SANDBOX_CLERK_USER_ID` in Admin > System Variables (infrastructure category)
2. Deploy Convex (`pnpm convex:deploy`)
3. Start a session sandbox
4. Verify preview iframe loads and auto-authenticates (no "blocked" message, Convex queries work)
5. Check browser cookies — `__session` should be set on the Daytona proxy domain

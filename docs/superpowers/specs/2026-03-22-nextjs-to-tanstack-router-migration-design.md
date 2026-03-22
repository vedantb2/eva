# Next.js → Vite + TanStack Router Migration

**Date:** 2026-03-22
**Status:** Approved
**Approach:** Vite + TanStack Router (pure SPA, no SSR)

## Context

The web app (`apps/web`) uses Next.js but has virtually zero server-side usage. All data fetching is client-side via Convex (400+ useQuery/useMutation/useAction calls across 100+ client components). Every `page.tsx` is an empty Server Component shell that renders a `*Client.tsx` (except the landing page which is a Server Component with direct Clerk imports). The only server-side code is a dev-only API route and a middleware (`proxy.ts`) handling auth guards and monorepo URL rewrites.

**Goal:** Create `apps/web-v2` as a Vite + TanStack Router SPA that is functionally identical to `apps/web`. The existing web app stays completely untouched.

## Decisions

| Decision        | Choice                                                         | Rationale                                                                                                                 |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Vite + TanStack Router (SPA)                                   | Zero server needs. Type-safe routing is an upgrade.                                                                       |
| Auth            | `@clerk/clerk-react`                                           | Standard SPA Clerk package. Same components/hooks.                                                                        |
| Theme           | Replace `next-themes` with custom hook + existing ThemeContext | ThemeContext calls `useTheme()` from `next-themes`. Replace with ~40-line custom hook. Theme persistence stays in Convex. |
| Fonts           | Fontsource                                                     | Self-hosted, tree-shakeable, Vite-native.                                                                                 |
| Tailwind        | Copy config from `apps/web`                                    | Simplest path. Extract shared preset later if needed.                                                                     |
| URL state       | Keep nuqs with TanStack Router adapter                         | Minimal migration. Existing `useQueryState` calls unchanged.                                                              |
| Route structure | Mirror current layout groups                                   | `_global.tsx` = top-nav layout, `_repo.tsx` = sidebar layout.                                                             |
| App location    | `apps/web-v2`                                                  | Coexists with `apps/web`. Rename after migration verified.                                                                |
| Agent login     | New Convex HTTP action                                         | Moves server-side Clerk token creation to Convex. No server env vars needed in SPA.                                       |
| Monorepo URLs   | Keep `--` encoding in URLs                                     | `$repo` param captures `repo--appName`. Parsed by existing `decodeRepoParam`. No middleware needed.                       |
| Analytics       | `@vercel/analytics/react`                                      | SPA-compatible version of the same package.                                                                               |

## Architecture

### Project Scaffold

- **`apps/web-v2/`** — Vite + React + TanStack Router
- **Vite plugins:** `@vitejs/plugin-react`, `@tanstack/router-plugin/vite`
- **TypeScript:** Strict, `@/*` path alias → `./src/`
- **Tailwind:** Copied config + `globals.css` from `apps/web`
- **Workspace deps:** `@conductor/backend`, `@conductor/ui`, `@conductor/shared`
- **Build output:** Static `dist/`, deployed to Vercel with SPA rewrite
- **Fontsource packages:** `@fontsource-variable/inter`, `@fontsource-variable/roboto`, `@fontsource-variable/poppins`, `@fontsource-variable/dm-sans`, `@fontsource-variable/space-grotesk`, `@fontsource-variable/source-serif-4`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/outfit`, `@fontsource-variable/nunito`, `@fontsource-variable/ibm-plex-sans`, `@fontsource-variable/figtree`, plus `geist` (works in any bundler)

### Provider Stack (`src/routes/__root.tsx`)

Merges root `layout.tsx` (`ClerkProvider`) and `ClientProvider.tsx` into a single provider stack:

```
ClerkProvider (publishableKey from VITE_CLERK_PUBLISHABLE_KEY — currently in layout.tsx)
  └─ NuqsAdapter (TanStack Router adapter)
       └─ ConvexProviderWithClerk (useAuth from @clerk/clerk-react)
            └─ ConvexQueryCacheProvider
                 └─ EnsureUser (effect, no UI)
                 └─ CustomThemesProvider (replaces next-themes, manages .dark class + localStorage)
                      └─ AuthLoading → spinner
                      └─ Authenticated
                           └─ ThemeProvider (custom, reads from Convex, applies CSS vars)
                                └─ TooltipProvider
                                     └─ children + PresenceHeartbeat
```

**`CustomThemesProvider`** replaces `next-themes`. ~40 lines:

- Reads `localStorage("theme")` on mount
- Listens to `prefers-color-scheme` media query when theme is "system"
- Toggles `.dark` class on `<html>`
- Exposes `{ theme, setTheme }` via context
- Anti-flash `<script>` in `index.html` handles the pre-React flash

### Monorepo URL Handling

**Current behavior (Next.js):** `proxy.ts` middleware rewrites `/owner/repo/appName/sessions` to `/owner/repo--appName/sessions` server-side. The browser URL stays clean. Client uses `normalizePathname()` to undo the rewrite.

**New behavior (SPA):** No server-side rewriting available. The `--` encoding becomes the canonical URL format:

- Links output `/${owner}/${name}--${appName}/sessions` (change `repoHref` to use `--` instead of `/`)
- `$repo` param captures `repo` or `repo--appName`
- `decodeRepoParam` parses it (already exists, no changes needed)
- `normalizePathname` is no longer needed (URLs are already in their final form)
- Drop `KNOWN_SUB_PAGES` set — no disambiguation needed

### Middleware Replacement

The `proxy.ts` middleware performs 4 functions. Each is replaced:

| Middleware function                         | SPA replacement                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Agent auto-login (`/?agent` → API route)    | Root route `beforeLoad` checks `?agent` param, redirects to Convex HTTP action             |
| Authenticated root redirect (`/` → `/home`) | Root route `beforeLoad` checks auth, redirects                                             |
| Auth guard (unauthenticated → sign-in)      | `beforeLoad` on `_global` and `_repo` layout routes checks `useAuth`, redirects to sign-in |
| Monorepo URL rewrite                        | Eliminated — `--` encoding is the URL format                                               |

### Route Structure

```
src/routes/
├── __root.tsx                          # Provider stack
├── index.tsx                           # Landing page (/)
├── agent-callback.tsx                  # /agent-callback
├── _global.tsx                         # Layout: top-nav + auth guard
├── _global/
│   ├── home.tsx                        # /home
│   ├── inbox.tsx                       # /inbox
│   ├── settings/
│   │   └── theme.tsx                   # /settings/theme
│   ├── setup/
│   │   └── $id.tsx                     # /setup/$id
│   └── teams/
│       ├── index.tsx                   # /teams
│       └── $teamId.tsx                 # /teams/$teamId
├── _repo.tsx                           # Layout: auth guard
└── _repo/
    └── $owner/
        └── $repo.tsx                   # Layout: RepoProvider + sidebar context (parses $repo with decodeRepoParam)
        └── $repo/
            ├── index.tsx               # /$owner/$repo
            ├── sessions/
            │   ├── index.tsx
            │   └── $id.tsx
            ├── projects/
            │   ├── index.tsx
            │   └── $projectId.tsx
            ├── designs/
            │   ├── index.tsx
            │   └── $id.tsx
            ├── analyse/
            │   ├── index.tsx
            │   ├── files.tsx
            │   ├── routines.tsx
            │   ├── saved-queries.tsx
            │   └── query/
            │       └── $id.tsx
            ├── automations/
            │   ├── index.tsx
            │   └── $id.tsx
            ├── docs/
            │   ├── index.tsx
            │   └── $id.tsx
            ├── inbox.tsx
            ├── quick-tasks.tsx
            ├── stats.tsx
            ├── testing-arena/
            │   ├── index.tsx
            │   └── $id.tsx
            └── settings/
                ├── config.tsx
                ├── audits.tsx
                ├── env-variables.tsx
                ├── logs.tsx
                ├── mcp-config.tsx
                ├── monorepo.tsx
                ├── snapshots.tsx
                └── theme.tsx
```

**Conventions:**

- `_prefix` = pathless layout route (wraps children, no URL segment)
- `$param` = dynamic segment
- `$repo.tsx` alongside `$repo/` = layout for that dynamic segment
- Passthrough layouts (sessions, analyse, designs, docs, testing-arena) from Next.js are NOT recreated — they only existed to prevent Next.js full-page re-renders

### Component Migration

**Unchanged (zero edits):**

- All `*Client.tsx` components → become route `component` exports directly
- All `lib/` code → moves to `src/lib/` (except items noted below)
- All `@conductor/*` imports
- All Convex hooks
- `globals.css` and CSS variables

**Mechanical replacements:**

| From                                                                                 | To                                                                                                              | Files affected                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `import { useRouter } from "next/navigation"` / `router.push()` / `router.replace()` | `import { useNavigate } from "@tanstack/react-router"` / `navigate({ to })` / `navigate({ to, replace: true })` | ~20                                           |
| `import Link from "next/link"` / `<Link href="...">`                                 | `import { Link } from "@tanstack/react-router"` / `<Link to="...">`                                             | ~18                                           |
| `import { usePathname } from "next/navigation"`                                      | `import { useLocation } from "@tanstack/react-router"` / `location.pathname`                                    | ~3                                            |
| `import { useSearchParams } from "next/navigation"`                                  | `import { useSearch } from "@tanstack/react-router"` (or keep nuqs)                                             | ~2                                            |
| `import { ... } from "@clerk/nextjs"`                                                | `import { ... } from "@clerk/clerk-react"`                                                                      | ~7                                            |
| `import Image from "next/image"` / `<Image>`                                         | `<img>` tag                                                                                                     | ~6                                            |
| `redirect("/path")` (server-side, next/navigation)                                   | `beforeLoad` redirect in route definition                                                                       | 1                                             |
| `import { useTheme } from "next-themes"`                                             | `import { useTheme } from "@/lib/hooks/useTheme"` (custom)                                                      | 2 (ThemeContext.tsx, ThemeSettingsClient.tsx) |
| `import { ThemeProvider as NextThemesProvider } from "next-themes"`                  | `import { CustomThemesProvider } from "@/lib/components/CustomThemesProvider"`                                  | 1 (ClientProvider.tsx)                        |
| `import { NuqsAdapter } from "nuqs/adapters/next/app"`                               | `import { NuqsAdapter } from "nuqs/adapters/tanstack-router"`                                                   | 1                                             |
| `repoHref(owner, name, rootDir)` outputs `/owner/name/appName`                       | Change to output `/owner/name--appName`                                                                         | 1 (repoUrl.ts)                                |
| `@vercel/analytics/next`                                                             | `@vercel/analytics/react`                                                                                       | 1                                             |

**Files deleted (not migrated):**

- `env/server.ts` — no server env vars in SPA
- `proxy.ts` — middleware logic replaced by route `beforeLoad` hooks
- `app/api/auth/agent-login/route.ts` — replaced by Convex HTTP action
- All `page.tsx` shell components — routes render the Client component directly
- `normalizePathname()` in `repoUrl.ts` — no longer needed

### Deployment

**`apps/web-v2/vercel.json`:**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/:owner/:repo/sessions/:path*",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

**`index.html`:**

- Anti-flash theme script (reads `localStorage`, sets `.dark`)
- Static meta tags (title, description, OG, viewport, icons)
- PWA manifest link → `public/manifest.json` (static, converted from current `app/manifest.ts`)

**Environment variables (client-only):**

- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_ENV` (development | staging | production)
- Validated via `@t3-oss/env-core`
- `env/server.ts` is dropped entirely — all server-side env vars live in Convex

### Agent Login Flow

**New Convex HTTP action** (additive, in `packages/backend`):

- Uses `@clerk/backend` createClerkClient to create sign-in token
- Reads `CLERK_SECRET_KEY` and `AGENT_CLERK_USER_ID` from Convex env vars
- Returns redirect to `/agent-callback?ticket=...`

**Client-side:** Root route `index.tsx` `beforeLoad` checks for `?agent` query param and redirects to the Convex HTTP endpoint (replaces `proxy.ts` agent detection).

### Landing Page

The landing page (`/`) is NOT a Server Component shell — it directly uses `SignInButton`/`SignUpButton` from Clerk and `Image` from `next/image`. Migration:

- `SignInButton`/`SignUpButton` → from `@clerk/clerk-react`
- `Image` → `<img>` tag
- `process.env.NEXT_PUBLIC_ENV` → `import.meta.env.VITE_ENV`
- Auth redirect logic (authenticated → `/home`) → `beforeLoad` in route definition

## Out of Scope

- No changes to `apps/web` (stays fully functional)
- No changes to `packages/ui` or `packages/shared`
- No SSR or landing page SEO
- No route restructuring beyond mirroring current structure
- No nuqs → TanStack search params migration
- No dependency version changes
- No feature work — pure framework migration
- Convex HTTP action for agent-login is additive to `packages/backend`, not modifying existing code

# Next.js → Vite + TanStack Router Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `apps/web-v2` as a Vite + TanStack Router SPA functionally identical to `apps/web`, without modifying the existing web app.

**Architecture:** Pure SPA with Vite + TanStack Router for routing, `@clerk/clerk-react` for auth, Convex for all data, Fontsource for fonts. Provider stack mirrors current app: ClerkProvider at root, ClientProvider in layout groups. Deployed to Vercel as static files.

**Tech Stack:** Vite, TanStack Router, React 19, Clerk, Convex, Tailwind CSS 3, Fontsource, nuqs, @t3-oss/env-core

**Spec:** `docs/superpowers/specs/2026-03-22-nextjs-to-tanstack-router-migration-design.md`

---

### Task 1: Scaffold Vite Project

**Files:**

- Create: `apps/web-v2/package.json`
- Create: `apps/web-v2/vite.config.ts`
- Create: `apps/web-v2/tsconfig.json`
- Create: `apps/web-v2/postcss.config.js`
- Create: `apps/web-v2/index.html`
- Create: `apps/web-v2/src/main.tsx`
- Create: `apps/web-v2/src/routeTree.gen.ts` (auto-generated placeholder)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@conductor/web-v2",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.25.0",
    "@conductor/backend": "workspace:*",
    "@conductor/shared": "workspace:*",
    "@conductor/ui": "workspace:*",
    "@convex-dev/presence": "^0.3.0",
    "@convex-dev/prosemirror-sync": "^0.2.1",
    "@t3-oss/env-core": "^0.13.8",
    "@tanstack/react-router": "^1.120.0",
    "@vercel/analytics": "^1.5.0",
    "convex": "^1.24.1",
    "convex-helpers": "^0.1.88",
    "nuqs": "^2.8.8",
    "react": "19.2.1",
    "react-dom": "19.2.1",
    "zod": "^4.1.5"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.19",
    "@tanstack/router-plugin": "^1.120.0",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.0.4",
    "@vitejs/plugin-react": "^4.5.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.9.3",
    "vite": "^6.3.0"
  }
}
```

NOTE: This is the minimal set. After copying `lib/` in Task 5, additional deps from `apps/web/package.json` will be needed (all the Radix UI, DnD kit, xterm, chart.js, tiptap, etc.). Copy them from `apps/web/package.json` dependencies — everything EXCEPT: `next`, `@clerk/nextjs`, `next-themes`, `@t3-oss/env-nextjs`, `eslint-config-next`. Also add all Fontsource packages (see Task 2).

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [TanStackRouterVite({ routesDirectory: "./src/routes" }), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    },
    "target": "ES2017"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "./vite-env.d.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <meta name="theme-color" content="#0d9488" />
    <meta
      name="description"
      content="Meet Eva, your new AI coworker. Manage tasks, ship code, and track progress in real-time."
    />
    <meta
      name="keywords"
      content="ai coworker, coding assistant, task management, developer tools, code automation"
    />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Eva" />
    <meta property="og:title" content="Eva" />
    <meta
      property="og:description"
      content="Meet Eva, your new AI coworker. Manage tasks, ship code, and track progress in real-time."
    />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Eva" />
    <meta name="format-detection" content="telephone=no" />
    <link rel="icon" href="/icon.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Eva - Your New Coworker</title>
    <script>
      (function () {
        var t = localStorage.getItem("theme");
        if (
          t === "dark" ||
          (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
          document.documentElement.classList.add("dark");
        }
      })();
    </script>
  </head>
  <body class="font-sans text-foreground">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./globals.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
```

- [ ] **Step 7: Create `vite-env.d.ts` (at project root, not src/)**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 8: Commit**

```bash
git add apps/web-v2/package.json apps/web-v2/vite.config.ts apps/web-v2/tsconfig.json apps/web-v2/postcss.config.js apps/web-v2/index.html apps/web-v2/src/main.tsx apps/web-v2/src/vite-env.d.ts
git commit -m "feat(web-v2): scaffold Vite + TanStack Router project"
```

---

### Task 2: Set Up Tailwind, Fonts, and CSS

**Files:**

- Create: `apps/web-v2/tailwind.config.js` (copy from `apps/web/tailwind.config.js`)
- Create: `apps/web-v2/src/globals.css` (copy from `apps/web/app/globals.css`)
- Create: `apps/web-v2/src/fonts.ts`
- Modify: `apps/web-v2/package.json` (add Fontsource deps)

- [ ] **Step 1: Copy `tailwind.config.js` from `apps/web/tailwind.config.js`**

Adjust content paths for Vite project structure:

```js
content: [
  "./index.html",
  "./src/**/*.{ts,tsx}",
  "../../packages/ui/src/**/*.{ts,tsx}",
],
```

Everything else (themeExtend, plugins, darkMode) stays identical.

- [ ] **Step 2: Copy `globals.css` from `apps/web/app/globals.css` to `apps/web-v2/src/globals.css`**

No modifications needed. Already imported in `main.tsx`.

- [ ] **Step 3: Create `src/fonts.ts`**

Import all Fontsource packages. These inject `@font-face` rules globally when imported.

```ts
import "@fontsource-variable/inter";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/outfit";
import "@fontsource-variable/nunito";
import "@fontsource-variable/figtree";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
```

NOTE: Roboto, Poppins, and IBM Plex Sans are NOT variable fonts — use weight-specific imports from `@fontsource/` (not `@fontsource-variable/`). For Geist, use `@fontsource-variable/geist-sans` (the `geist` package depends on `next/font` internals).

- [ ] **Step 3b: Add font CSS variable declarations**

Next.js `next/font/google` automatically creates CSS variables (`--font-inter`, `--font-roboto`, etc.) on the `<html>` element. Fontsource does NOT do this — it only injects `@font-face` rules. The app depends on these variables in `globals.css` (`--font-sans: var(--font-inter), ...`) and in `ThemeContext.tsx` (`FONT_FAMILIES` stacks).

The simplest fix: modify `FONT_FAMILIES` in `ThemeContext.tsx` and `globals.css` to use direct font family names instead of CSS variables.

In `globals.css`, change:

```css
--font-sans: var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif;
```

to:

```css
--font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
```

In `ThemeContext.tsx`, simplify the `FONT_FAMILIES` map stacks — remove the `var(--font-*)` prefix from each stack since the font is globally available by name via Fontsource. For example:

```
"var(--font-inter), Inter, ui-sans-serif, ..." → "Inter, ui-sans-serif, ..."
"var(--font-dm-sans), 'DM Sans', ..." → "'DM Sans', ui-sans-serif, ..."
```

The `variable` field in `FONT_FAMILIES` can be kept for reference but is no longer used at runtime.

When the user picks a font in ThemeSettingsClient, the `setCustomTheme` call updates `--font-sans` to the selected font's stack — which now directly names the font. This works because Fontsource makes all fonts globally available.

- [ ] **Step 4: Import fonts in `main.tsx`**

Add at the top of `src/main.tsx`:

```ts
import "./fonts";
```

- [ ] **Step 5: Copy `apps/web/public/icon.png` to `apps/web-v2/public/icon.png`**

Also create `apps/web-v2/public/manifest.json` (convert from `apps/web/app/manifest.ts`):

```json
{
  "name": "Eva - Your New Coworker",
  "short_name": "Eva",
  "description": "Meet Eva, your new AI coworker. Manage tasks, ship code, and track progress in real-time.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    { "src": "/icon.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon.png", "sizes": "512x512", "type": "image/png" }
  ],
  "categories": ["productivity", "developer tools"],
  "lang": "en",
  "dir": "ltr"
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web-v2/tailwind.config.js apps/web-v2/src/globals.css apps/web-v2/src/fonts.ts apps/web-v2/public/ apps/web-v2/src/main.tsx
git commit -m "feat(web-v2): add Tailwind, Fontsource fonts, and static assets"
```

---

### Task 3: Environment Config and Vercel Config

**Files:**

- Create: `apps/web-v2/src/env/client.ts`
- Create: `apps/web-v2/vercel.json`

- [ ] **Step 1: Create `src/env/client.ts`**

```ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const clientEnv = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_CONVEX_URL: z.string().min(1),
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    VITE_ENV: z.enum(["development", "staging", "production"]),
  },
  runtimeEnv: import.meta.env,
});
```

- [ ] **Step 2: Create `vercel.json`**

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

- [ ] **Step 3: Commit**

```bash
git add apps/web-v2/src/env/client.ts apps/web-v2/vercel.json
git commit -m "feat(web-v2): add env validation and Vercel deployment config"
```

---

### Task 4: Custom Theme Hook (Replace next-themes)

**Files:**

- Create: `apps/web-v2/src/lib/hooks/useThemeMode.ts`
- Create: `apps/web-v2/src/lib/components/ThemeModeProvider.tsx`

- [ ] **Step 1: Create `src/lib/hooks/useThemeMode.ts`**

This replaces `useTheme()` from `next-themes`. Manages `light` / `dark` / `system` mode.

```tsx
import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeModeContextValue {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}
```

- [ ] **Step 2: Create `src/lib/components/ThemeModeProvider.tsx`**

```tsx
import { useState, useEffect, useCallback } from "react";
import { ThemeModeContext } from "@/lib/hooks/useThemeMode";
import type { ThemeMode } from "@/lib/hooks/useThemeMode";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light" || stored === "system")
      return stored;
    return "light";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveTheme(theme),
  );

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeModeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-v2/src/lib/hooks/useThemeMode.ts apps/web-v2/src/lib/components/ThemeModeProvider.tsx
git commit -m "feat(web-v2): add custom ThemeModeProvider replacing next-themes"
```

---

### Task 5: Copy lib/ and Apply Mechanical Replacements

**Files:**

- Copy: `apps/web/lib/` → `apps/web-v2/src/lib/` (entire directory)
- Modify: Multiple files for import replacements

This is the bulk migration task. Copy the entire `lib/` directory, then apply all mechanical replacements.

- [ ] **Step 1: Copy `apps/web/lib/` to `apps/web-v2/src/lib/`**

```bash
cp -r apps/web/lib/* apps/web-v2/src/lib/
```

The Task 4 files (`useThemeMode.ts`, `ThemeModeProvider.tsx`) are NEW files that don't exist in `apps/web/lib/`, so the copy won't overwrite them.

- [ ] **Step 2: Replace `@clerk/nextjs` → `@clerk/clerk-react`**

In these files under `apps/web-v2/src/lib/`:

- `components/ClientProvider.tsx`: `useAuth` import
- `hooks/useOneShotQuery.ts`: `useAuth` import
- `components/TopNavBar.tsx`: `UserButton` import
- `components/Sidebar.tsx`: `UserButton`, `useUser` import

Find: `from "@clerk/nextjs"`
Replace: `from "@clerk/clerk-react"`

- [ ] **Step 3: Replace `next/navigation` imports**

**`useRouter` → `useNavigate`** in these files:

- `components/NotificationToastStream.tsx`
- `components/NotificationsPopoverClient.tsx`
- `components/quick-tasks/GroupTasksModal.tsx`
- `components/SpotlightSearch.tsx`
- `components/inbox/InboxClient.tsx`
- `components/PageHeader.tsx`
- `components/Sidebar.tsx`
- `components/PageWrapper.tsx`
- `components/projects/NewProjectModal.tsx`
- `components/sidebar/AnalyseSidebar.tsx`
- `components/sidebar/SessionListSidebar.tsx`
- `components/projects/ProjectFinalizationModal.tsx`
- `components/projects/ProjectDetailInline.tsx`
- `components/sidebar/DocsSidebar.tsx`
- `components/sidebar/AutomationsSidebar.tsx`
- `components/projects/ProjectCardModal.tsx`
- `components/projects/ProjectPlanTab.tsx`

For each file:

1. Change import: `import { useRouter } from "next/navigation"` → `import { useNavigate } from "@tanstack/react-router"`
2. Change hook call: `const router = useRouter()` → `const navigate = useNavigate()`
3. Change usages: `router.push("/path")` → `navigate({ to: "/path" })`, `router.replace("/path")` → `navigate({ to: "/path", replace: true })`
4. Some files also use `router.back()` → `window.history.back()` (or `navigate({ to: ".." })`)

**`usePathname` → `useLocation`** in these files:

- `components/PageHeader.tsx`
- `components/TopNavBar.tsx`
- `components/Sidebar.tsx`

Change: `import { usePathname } from "next/navigation"` → `import { useLocation } from "@tanstack/react-router"`
Change: `const pathname = usePathname()` → `const { pathname } = useLocation()`

**`useSearchParams`** in these files (already using nuqs for most URL state — check if these are one-off usages):

- These two files are in route components (AgentCallback, RepoSetupClient), not lib/. Handle in Task 7/8.

- [ ] **Step 4: Replace `next/link` → `@tanstack/react-router` Link**

In these files:

- `components/NotificationsPopoverClient.tsx`
- `components/SetupBanner.tsx`
- `components/Sidebar.tsx`
- `components/TopNavBar.tsx`
- `components/sidebar/TestingArenaSidebar.tsx`
- `components/sidebar/SidebarSessionItem.tsx`
- `components/sidebar/SettingsSidebar.tsx`
- `components/sidebar/SessionListSidebar.tsx`
- `components/sidebar/ActiveTasksPopover.tsx`
- `components/sidebar/ActiveTasksAccordion.tsx`
- `components/sidebar/AutomationsSidebar.tsx`
- `components/sidebar/AnalyseSidebar.tsx`
- `components/sidebar/DocsSidebar.tsx`

For each file:

1. Change import: `import Link from "next/link"` → `import { Link } from "@tanstack/react-router"`
2. Change prop: `<Link href="/path">` → `<Link to="/path">`
3. Any dynamic href: `<Link href={`/foo/${id}`}>` → `<Link to={`/foo/${id}`}>`

NOTE: 5 more files with `next/link` are in route-level components (RepoCard, TeamsClient, ProjectDetailClient, TeamEnvVarsClient, ChatPanel) — handle when porting those routes in Tasks 8/9.

- [ ] **Step 5: Replace `next/image` → `<img>`**

In these files:

- `components/EvaIcon.tsx`
- `components/Sidebar.tsx`
- `components/plan/ChatMessage.tsx`
- `components/TopNavBar.tsx`

For each:

1. Remove `import Image from "next/image"`
2. Change `<Image src="..." alt="..." width={N} height={N} className="..." />` to `<img src="..." alt="..." width={N} height={N} className="..." />`

NOTE: 2 more files with `next/image` are in route components (landing page, RepoHomeClient) — handle in Tasks 7/9.

- [ ] **Step 6: Replace `next-themes` in ThemeContext.tsx**

File: `apps/web-v2/src/lib/contexts/ThemeContext.tsx`

1. Change import: `import { useTheme } from "next-themes"` → `import { useThemeMode } from "@/lib/hooks/useThemeMode"`
2. Change usage: `const { theme, setTheme: setNextTheme } = useTheme()` → `const { theme, setTheme: setNextTheme } = useThemeMode()`

File: `apps/web-v2/src/lib/components/theme/ThemeSettingsClient.tsx`

1. Change import: `import { useTheme } from "next-themes"` → `import { useThemeMode } from "@/lib/hooks/useThemeMode"`
2. Change usage: `const { setTheme: setNextTheme } = useTheme()` → `const { setTheme: setNextTheme } = useThemeMode()`

- [ ] **Step 7: Replace nuqs adapter in ClientProvider.tsx**

File: `apps/web-v2/src/lib/components/ClientProvider.tsx`

1. Change import: `import { NuqsAdapter } from "nuqs/adapters/next/app"` → remove this import (NuqsAdapter moves to \_\_root.tsx)
2. Remove `<NuqsAdapter>` wrapper from the JSX — \_\_root.tsx will provide it.
3. Change: `import { ThemeProvider as NextThemesProvider } from "next-themes"` → `import { ThemeModeProvider } from "@/lib/components/ThemeModeProvider"`
4. Change `<NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>` → `<ThemeModeProvider>`
5. Change env reference: `clientEnv.NEXT_PUBLIC_CONVEX_URL` → `clientEnv.VITE_CONVEX_URL`

- [ ] **Step 8: Update `repoUrl.ts`**

File: `apps/web-v2/src/lib/utils/repoUrl.ts`

1. Change `repoHref` function to use `--` encoding:

```ts
export function repoHref(
  owner: string,
  name: string,
  rootDirectory?: string,
): string {
  if (!rootDirectory) return `/${owner}/${name}`;
  const appName = rootDirectory.split("/").pop();
  return `/${owner}/${name}--${appName}`;
}
```

2. Delete `normalizePathname` function (no longer needed — URLs are canonical)

- [ ] **Step 9: Replace `@vercel/analytics/next` (if present in lib/)**

This import is only in `apps/web/app/layout.tsx` which is a route file, not lib/. It will be handled in \_\_root.tsx. No action in lib/.

- [ ] **Step 10: Commit**

```bash
git add apps/web-v2/src/lib/
git commit -m "feat(web-v2): copy lib/ and apply all mechanical import replacements"
```

---

### Task 6: Root Route and Provider Stack

**Files:**

- Create: `apps/web-v2/src/routes/__root.tsx`

- [ ] **Step 1: Create `src/routes/__root.tsx`**

This mirrors the current root `layout.tsx` (ClerkProvider) + adds NuqsAdapter and Vercel Analytics.

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { clientEnv } from "@/env/client";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ClerkProvider
      publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
    >
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
      <Analytics />
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-v2/src/routes/__root.tsx
git commit -m "feat(web-v2): add root route with ClerkProvider and NuqsAdapter"
```

---

### Task 7: Landing Page and Agent Callback Routes

**Files:**

- Create: `apps/web-v2/src/routes/index.tsx`
- Create: `apps/web-v2/src/routes/agent-callback.tsx`

- [ ] **Step 1: Create `src/routes/index.tsx` (landing page)**

Port from `apps/web/app/page.tsx`. Changes:

- `Image` → `<img>`
- `@clerk/nextjs` → `@clerk/clerk-react`
- `process.env.NEXT_PUBLIC_ENV` → `clientEnv.VITE_ENV`
- Add `beforeLoad` to redirect authenticated users to `/home` and handle `?agent` param

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@conductor/ui";
import { clientEnv } from "@/env/client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const isProduction = clientEnv.VITE_ENV === "production";

function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/icon.png"
            alt="Eva"
            width={80}
            height={80}
            className="rounded-2xl"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Eva
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Your AI Coworker
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isProduction ? (
            <>
              <Button size="lg" variant="default" disabled>
                Sign In
              </Button>
              <Button size="lg" variant="outline" disabled>
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button size="lg" variant="default">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="lg" variant="outline">
                  Sign Up
                </Button>
              </SignUpButton>
            </>
          )}
        </div>

        {isProduction && (
          <div className="max-w-sm rounded-lg bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            Eva is fully open source and self-hosted. Clone the repo, create
            your own Convex and Clerk projects, and run it locally.
          </div>
        )}
      </div>
    </div>
  );
}
```

NOTE: Auth-based redirect (`/` → `/home` for authenticated users) and `?agent` redirect need Clerk's auth state. Since `beforeLoad` runs outside React, you cannot use hooks. Two options:

1. Handle it in the component with `useAuth` from Clerk + `useNavigate` in an effect.
2. Use Clerk's `__clerk_status` cookie or `window.Clerk` state.

The simplest approach: handle in the component with a `useAuth` check + redirect effect. Read the current auth state and if signed in, call `navigate({ to: "/home", replace: true })`. For `?agent`, check `window.location.search` and redirect to the Convex HTTP action.

- [ ] **Step 2: Create `src/routes/agent-callback.tsx`**

Port from `apps/web/app/agent-callback/AgentCallback.tsx`. Changes:

- `@clerk/nextjs` → `@clerk/clerk-react`
- `useSearchParams` + `useRouter` → TanStack Router equivalents

```tsx
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useSignIn } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/agent-callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: typeof search.ticket === "string" ? search.ticket : "",
  }),
  component: AgentCallback,
});

function AgentCallback() {
  const { signIn, setActive } = useSignIn();
  const { ticket } = useSearch({ from: "/agent-callback" });
  const navigate = useNavigate();
  const consumed = useRef(false);

  useEffect(() => {
    if (!ticket || !signIn || consumed.current) return;
    consumed.current = true;

    signIn
      .create({ strategy: "ticket", ticket })
      .then((result) => {
        if (result.createdSessionId) {
          return setActive({ session: result.createdSessionId }).then(() => {
            navigate({ to: "/home", replace: true });
          });
        }
      })
      .catch((err: Error) => {
        console.error("Agent sign-in failed:", err);
      });
  }, [signIn, setActive, ticket, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
```

NOTE: `useSearch` typing depends on the `validateSearch` schema. The `useRef` pattern is kept to prevent double-consumption in StrictMode.

- [ ] **Step 3: Commit**

```bash
git add apps/web-v2/src/routes/index.tsx apps/web-v2/src/routes/agent-callback.tsx
git commit -m "feat(web-v2): add landing page and agent-callback routes"
```

---

### Task 8: Global Layout and Routes

**Files:**

- Create: `apps/web-v2/src/routes/_global.tsx`
- Create: `apps/web-v2/src/routes/_global/home.tsx`
- Create: `apps/web-v2/src/routes/_global/inbox.tsx`
- Create: `apps/web-v2/src/routes/_global/settings/theme.tsx`
- Create: `apps/web-v2/src/routes/_global/setup/$id.tsx`
- Create: `apps/web-v2/src/routes/_global/teams/index.tsx`
- Create: `apps/web-v2/src/routes/_global/teams/$teamId.tsx`
- Copy route-level components to `src/routes/_global/` alongside their route files

- [ ] **Step 1: Create `_global.tsx` layout**

This mirrors `apps/web/app/(global)/layout.tsx`. Wraps children in ClientProvider + TopNavBar.

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { TopNavBar } from "@/lib/components/TopNavBar";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";

export const Route = createFileRoute("/_global")({
  component: GlobalLayout,
});

function GlobalLayout() {
  return (
    <ClientProvider>
      <div className="relative min-h-screen bg-app-shell">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
        />
        <TopNavBar />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
        <NotificationToastStream />
      </div>
    </ClientProvider>
  );
}
```

NOTE: Auth guard — the current middleware redirects unauthenticated users on protected routes. In TanStack Router, add auth checking in the component (using `useAuth` from Clerk inside the ClientProvider context). The `Authenticated` component in ClientProvider already handles this by showing a spinner for AuthLoading and only rendering children inside `<Authenticated>`.

- [ ] **Step 2: Copy route-level `*Client.tsx` components**

Copy these files from `apps/web/app/(global)/` to `apps/web-v2/src/routes/_global/`:

- `apps/web/app/(global)/home/ReposClient.tsx` → `src/routes/_global/home/ReposClient.tsx`
- `apps/web/app/(global)/home/_components/` → `src/routes/_global/home/_components/` (contains RepoCard.tsx etc.)
- `apps/web/app/(global)/setup/[id]/RepoSetupClient.tsx` → `src/routes/_global/setup/RepoSetupClient.tsx`
- `apps/web/app/(global)/setup/[id]/_components/` → `src/routes/_global/setup/_components/` (contains RepoSetupCard.tsx, MonorepoAppsPanel.tsx)
- `apps/web/app/(global)/teams/TeamsClient.tsx` → `src/routes/_global/teams/TeamsClient.tsx`
- `apps/web/app/(global)/teams/[teamId]/TeamDetailClient.tsx` → `src/routes/_global/teams/TeamDetailClient.tsx`

Apply mechanical replacements to copied files:

- `useRouter` → `useNavigate` (in ReposClient, RepoSetupClient)
- `useSearchParams` → `useSearch` (in RepoSetupClient)
- `next/link` → `@tanstack/react-router` Link (in RepoCard, TeamsClient)
- `@clerk/nextjs` → `@clerk/clerk-react` (if any)

- [ ] **Step 3: Create route files**

Each route file imports and re-exports the corresponding Client component.

`src/routes/_global/home.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import ReposClient from "./home/ReposClient";

export const Route = createFileRoute("/_global/home")({
  component: ReposClient,
});
```

`src/routes/_global/inbox.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { InboxClient } from "@/lib/components/inbox/InboxClient";

export const Route = createFileRoute("/_global/inbox")({
  component: InboxClient,
});
```

`src/routes/_global/settings/theme.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ThemeSettingsClient } from "@/lib/components/theme/ThemeSettingsClient";

export const Route = createFileRoute("/_global/settings/theme")({
  component: ThemeSettingsClient,
});
```

`src/routes/_global/setup/$id.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import RepoSetupClient from "./RepoSetupClient";

export const Route = createFileRoute("/_global/setup/$id")({
  component: RepoSetupClient,
});
```

NOTE: RepoSetupClient currently reads params from `useSearchParams`. In TanStack Router, use `useParams` from the route: `const { id } = Route.useParams()`. Modify RepoSetupClient to accept the id via route params instead of reading from Next.js params prop.

`src/routes/_global/teams/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import TeamsClient from "./TeamsClient";

export const Route = createFileRoute("/_global/teams/")({
  component: TeamsClient,
});
```

`src/routes/_global/teams/$teamId.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import TeamDetailClient from "./TeamDetailClient";

export const Route = createFileRoute("/_global/teams/$teamId")({
  component: TeamDetailClient,
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-v2/src/routes/_global/
git commit -m "feat(web-v2): add global layout and routes (home, inbox, settings, setup, teams)"
```

---

### Task 9: Repo Layout and $owner/$repo Layout

**Files:**

- Create: `apps/web-v2/src/routes/_repo.tsx`
- Create: `apps/web-v2/src/routes/_repo/$owner/$repo.tsx`

- [ ] **Step 1: Create `_repo.tsx` layout**

Mirrors `apps/web/app/(repo)/layout.tsx`. ClientProvider + gradient background.

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";

export const Route = createFileRoute("/_repo")({
  component: RepoLayout,
});

function RepoLayout() {
  return (
    <ClientProvider>
      <div className="relative min-h-screen bg-app-shell">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
        />
        <div className="relative z-10">
          <Outlet />
        </div>
        <NotificationToastStream />
      </div>
    </ClientProvider>
  );
}
```

- [ ] **Step 2: Create `_repo/$owner/$repo.tsx` layout**

Mirrors `apps/web/app/(repo)/[owner]/[repo]/layout.tsx`. Provides RepoProvider, Sidebar, SearchProvider, SidebarProvider.

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RepoProvider } from "@/lib/contexts/RepoContext";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { Sidebar } from "@/lib/components/Sidebar";
import { SetupBanner } from "@/lib/components/SetupBanner";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { SearchProvider } from "@/lib/contexts/SearchContext";

export const Route = createFileRoute("/_repo/$owner/$repo")({
  component: RepoLayoutInner,
});

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden pt-14 transition-[padding] duration-300 lg:pt-0 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
        <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
          <SetupBanner />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function RepoLayoutInner() {
  const { owner, repo } = Route.useParams();

  return (
    <SidebarProvider>
      <SearchProvider>
        <RepoProvider owner={owner} repoParam={repo}>
          <Sidebar />
          <MainContent>
            <Outlet />
          </MainContent>
          <SpotlightSearch />
        </RepoProvider>
      </SearchProvider>
    </SidebarProvider>
  );
}
```

NOTE: The current layout gets params from `use(params)` (React 19 server component pattern). In TanStack Router, use `Route.useParams()` instead. The `repo` param may contain `--appName` — `decodeRepoParam` in RepoProvider/RepoContext handles this.

- [ ] **Step 3: Commit**

```bash
git add apps/web-v2/src/routes/_repo.tsx apps/web-v2/src/routes/_repo/$owner/$repo.tsx
git commit -m "feat(web-v2): add repo layout with sidebar, search, and repo context"
```

---

### Task 10: Port All Repo Routes

**Files:**

- Create: All route files under `apps/web-v2/src/routes/_repo/$owner/$repo/`
- Copy: All route-level `*Client.tsx` and `_components/` directories

This is the largest task. Most routes are trivial: import the Client component, export it as the route component.

- [ ] **Step 1: Copy all route-level components from `apps/web/app/(repo)/[owner]/[repo]/`**

For each sub-route, copy the `*Client.tsx` file and any `_components/` directory to the corresponding location under `src/routes/_repo/$owner/$repo/`.

Key directories to copy:

- `RepoHomeClient.tsx` + dependencies
- `projects/ProjectsClient.tsx`, `projects/[projectId]/ProjectDetailClient.tsx` + `_components/`
- `sessions/[id]/SessionDetailClient.tsx` + `_components/` (ChatPanel, SandboxPanel, etc.)
- `settings/config/ConfigClient.tsx`, `settings/env-variables/EnvVariablesPageClient.tsx` + `TeamEnvVarsClient.tsx`, `settings/audits/AuditsClient.tsx`, `settings/monorepo/MonorepoClient.tsx`, `settings/snapshots/SnapshotsClient.tsx`, `settings/logs/LogsClient.tsx`, `settings/mcp-config/McpConfigClient.tsx`
- `designs/[id]/DesignDetailClient.tsx` + `_components/`
- `analyse/query/[id]/QueryDetailClient.tsx`
- `analyse/saved-queries/page.tsx` (inline implementation, becomes the route component directly)
- `quick-tasks/QuickTasksClient.tsx` + `_components/`
- `stats/StatsClient.tsx`
- `automations/[id]/AutomationClient.tsx`
- `testing-arena/[id]/page.tsx` (inline implementation)
- `docs/[id]/page.tsx` (inline implementation)

- [ ] **Step 2: Apply mechanical replacements to copied route components**

Same patterns as Task 5:

- `next/link` → `@tanstack/react-router` Link (in ProjectDetailClient, TeamEnvVarsClient, ChatPanel, RepoCard)
- `next/image` → `<img>` (in RepoHomeClient)
- `useRouter` / `useSearchParams` → TanStack equivalents
- `@clerk/nextjs` → `@clerk/clerk-react` (if any)

- [ ] **Step 3: Create all route files**

Each route file follows this pattern:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import ComponentName from "./path/to/ComponentName";

export const Route = createFileRoute("/_repo/$owner/$repo/routepath")({
  component: ComponentName,
});
```

Create these route files:

**Root:**

- `src/routes/_repo/$owner/$repo/index.tsx` → imports `RepoHomeClient` (wrapped in PageWrapper)

**Sessions:**

- `src/routes/_repo/$owner/$repo/sessions/index.tsx` → inline EmptyState component
- `src/routes/_repo/$owner/$repo/sessions/$id.tsx` → imports `SessionDetailClient`

**Projects:**

- `src/routes/_repo/$owner/$repo/projects/index.tsx` → imports `ProjectsClient`
- `src/routes/_repo/$owner/$repo/projects/$projectId.tsx` → imports `ProjectDetailClient`

**Designs:**

- `src/routes/_repo/$owner/$repo/designs/index.tsx` → inline EmptyState
- `src/routes/_repo/$owner/$repo/designs/$id.tsx` → imports `DesignDetailClient`

**Analyse:**

- `src/routes/_repo/$owner/$repo/analyse/index.tsx` → inline EmptyState
- `src/routes/_repo/$owner/$repo/analyse/files.tsx` → inline placeholder
- `src/routes/_repo/$owner/$repo/analyse/routines.tsx` → inline placeholder
- `src/routes/_repo/$owner/$repo/analyse/saved-queries.tsx` → port inline implementation from `apps/web/app/(repo)/[owner]/[repo]/analyse/saved-queries/page.tsx`
- `src/routes/_repo/$owner/$repo/analyse/query/$id.tsx` → imports `QueryDetailClient`

**Automations:**

- `src/routes/_repo/$owner/$repo/automations/index.tsx` → inline EmptyState
- `src/routes/_repo/$owner/$repo/automations/$id.tsx` → imports `AutomationClient`

**Docs:**

- `src/routes/_repo/$owner/$repo/docs/index.tsx` → inline EmptyState
- `src/routes/_repo/$owner/$repo/docs/$id.tsx` → port inline implementation from `apps/web/app/(repo)/[owner]/[repo]/docs/[id]/page.tsx`

**Other:**

- `src/routes/_repo/$owner/$repo/inbox.tsx` → imports `InboxClient`
- `src/routes/_repo/$owner/$repo/quick-tasks.tsx` → imports `QuickTasksClient`
- `src/routes/_repo/$owner/$repo/stats.tsx` → imports `StatsClient`

**Testing Arena:**

- `src/routes/_repo/$owner/$repo/testing-arena/index.tsx` → inline EmptyState
- `src/routes/_repo/$owner/$repo/testing-arena/$id.tsx` → port inline implementation from `apps/web/app/(repo)/[owner]/[repo]/testing-arena/[id]/page.tsx`

**Settings:**

- `src/routes/_repo/$owner/$repo/settings/config.tsx` → imports `ConfigClient`
- `src/routes/_repo/$owner/$repo/settings/audits.tsx` → imports `AuditsClient`
- `src/routes/_repo/$owner/$repo/settings/env-variables.tsx` → imports `EnvVariablesPageClient`
- `src/routes/_repo/$owner/$repo/settings/logs.tsx` → imports `LogsClient`
- `src/routes/_repo/$owner/$repo/settings/mcp-config.tsx` → imports `McpConfigClient`
- `src/routes/_repo/$owner/$repo/settings/monorepo.tsx` → imports `MonorepoClient`
- `src/routes/_repo/$owner/$repo/settings/snapshots.tsx` → imports `SnapshotsClient`
- `src/routes/_repo/$owner/$repo/settings/theme.tsx` → imports `ThemeSettingsClient`

NOTE: The settings redirect (`/settings` → `/settings/config`) — create `src/routes/_repo/$owner/$repo/settings/index.tsx` with a component that uses `useNavigate` + effect to redirect to `./config` (relative path).

**IMPORTANT — Inline route components:** Several page.tsx files are NOT thin shells. They contain significant inline logic that must be ported directly into the route file:

- `automations/[id]/page.tsx` — wraps `AutomationClient` with `use(params)` unwrap + `useQuery` loading/error states. Port the wrapper logic into the route's component, using `Route.useParams()` instead of `use(params)`.
- `testing-arena/[id]/page.tsx` — ~458 lines with multiple inline subcomponents (`ReportCard`, `RunListItem`, `CodeTestingContent`). Port entire file as the route component.
- `docs/[id]/page.tsx` — `useQuery` + `useParams` wrapper around `DocViewer`. Port as route component.
- `analyse/saved-queries/page.tsx` — full inline implementation with `useQuery` + `useMutation`. Port as route component.

**IMPORTANT — `use(params)` / `await params` migration:** Any file using `use(params)` (React 19 Server Component pattern) or `await params` must change to `Route.useParams()` from TanStack Router. This affects all files that receive params as a prop. In the new architecture, route params are accessed via hooks, not props.

**IMPORTANT — `_components/` and `_utils.ts` directories:** When copying route-level components, also copy all co-located `_components/` directories and `_utils.ts` files. These exist in: projects, sessions, quick-tasks, designs, settings/logs, and the repo root level.

- [ ] **Step 4: Commit**

```bash
git add apps/web-v2/src/routes/_repo/
git commit -m "feat(web-v2): port all repo routes and components"
```

---

### Task 11: Install Dependencies and Verify Build

**Files:**

- Modify: `apps/web-v2/package.json` (add all remaining deps from `apps/web`)

- [ ] **Step 1: Add all remaining dependencies**

Copy ALL dependencies from `apps/web/package.json` that are NOT Next.js-specific. Exclude:

- `next`
- `@clerk/nextjs` (replaced with `@clerk/clerk-react`)
- `next-themes` (replaced with custom provider)
- `@t3-oss/env-nextjs` (replaced with `@t3-oss/env-core`)
- `eslint-config-next`

Add all Fontsource packages:

- `@fontsource-variable/inter`
- `@fontsource-variable/dm-sans`
- `@fontsource-variable/space-grotesk`
- `@fontsource-variable/source-serif-4`
- `@fontsource-variable/plus-jakarta-sans`
- `@fontsource-variable/outfit`
- `@fontsource-variable/nunito`
- `@fontsource-variable/figtree`
- `@fontsource/roboto`
- `@fontsource/poppins`
- `@fontsource/ibm-plex-sans`
- `@fontsource-variable/geist-sans`

- [ ] **Step 2: Run `pnpm install` from monorepo root**

```bash
pnpm install
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd apps/web-v2 && npx tsc --noEmit
```

Fix any type errors. Common issues:

- Missing type imports from route params
- `process.env` references that need to become `import.meta.env` or `clientEnv`
- `next/navigation` or `next/link` imports that were missed in the mechanical replacement

- [ ] **Step 4: Run `pnpm dev` to verify the app boots**

```bash
cd apps/web-v2 && pnpm dev
```

Verify:

- Landing page renders at `/`
- Auth flow works (sign in → redirected to `/home`)
- `/home` shows repos list
- A repo route like `/$owner/$repo` shows sidebar + content

- [ ] **Step 5: Commit**

```bash
git add apps/web-v2/package.json pnpm-lock.yaml
git commit -m "feat(web-v2): add all dependencies and verify build"
```

---

### Task 12: Add Root-Level Dev Script

**Files:**

- Modify: Root `package.json` (add web-v2 dev script)

- [ ] **Step 1: Add script to root `package.json`**

Add alongside existing scripts:

```json
"web-v2:dev": "pnpm --filter @conductor/web-v2 dev"
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add web-v2 dev script to root package.json"
```

---

### Task 13: Convex HTTP Action for Agent Login (Optional)

**Files:**

- Modify: `packages/backend/convex/http.ts` (or create if doesn't exist)

This is optional — only needed if the agent auto-login feature is required in web-v2. Can be deferred.

- [ ] **Step 1: Add HTTP action**

Create a new HTTP route at `/auth/agent-login` that:

1. Reads `CLERK_SECRET_KEY` and `AGENT_CLERK_USER_ID` from Convex env vars
2. Creates a sign-in token via `@clerk/backend`
3. Returns a redirect response to `/agent-callback?ticket=...`

- [ ] **Step 2: Update root route `index.tsx`**

Add `?agent` query param detection that redirects to the Convex HTTP endpoint.

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/http.ts apps/web-v2/src/routes/index.tsx
git commit -m "feat: add Convex HTTP action for agent auto-login"
```

---

## Notes for Implementer

**What NOT to touch:**

- `apps/web/` — nothing changes, ever
- `packages/ui/` — consumed as-is
- `packages/shared/` — consumed as-is
- `packages/backend/` — only Task 13 adds to it (optional)

**Common pitfalls:**

- TanStack Router auto-generates `routeTree.gen.ts` when running the dev server or build. Don't edit it manually.
- `createFileRoute` path strings must match the file path exactly (e.g., `"/_global/home"` for `src/routes/_global/home.tsx`).
- TanStack Router `Link` uses `to` prop, not `href`. Missing this causes runtime errors.
- Vite env vars use `import.meta.env.VITE_*`, NOT `process.env.NEXT_PUBLIC_*`. Any remaining `process.env` references will be `undefined` at runtime.
- The `@/*` path alias in `tsconfig.json` points to `./src/*` (not `./` like in Next.js). All `@/lib/...` imports resolve to `src/lib/...`.

**File count estimate:**

- ~10 config/scaffold files
- ~3 new files (ThemeModeProvider, useThemeMode, env/client.ts)
- ~50+ copied lib/ files with mechanical replacements
- ~35 route files
- ~20 copied route-level component files

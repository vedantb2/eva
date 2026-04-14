FOLLOW ALL OF THESE RULES

UI Design System — Tonal Surface Hierarchy:

Shadows:

- No shadows on inline elements (cards, buttons, inputs, tabs, alerts, checkboxes).
- Only floating/overlay elements (popovers, tooltips, dropdowns, dialogs, sheets) get shadows — they need depth to show layering over content.
- `shadow-none`/`border-0` on embedded form elements is fine — that's stripping inherited defaults, not adding decoration.

Borders:

- No borders for visual separation between layout regions (sidebar edge, section dividers, header/footer separators). Use background color contrast instead.
- No borders on cards, accordion items, or content containers. Use `bg-muted/40` or similar tonal shift.
- No borders on active/selected/hover states. Background color change alone indicates state.
- Borders allowed only for: form element affordance (inputs, selects) and structural metaphors (e.g. browser-tab in SandboxTabBar).

Layout & Surface Colors:

- Sidebar is always the darker surface, main content the lighter surface (both light and dark mode).
- Hierarchy comes from: tonal surface contrast > whitespace > typography weight/size.

Hover & Interaction States:

- Hover: `hover:bg-*` (background shift). Never `hover:border-*` or `hover:shadow-*`.
- Active/selected: `bg-*` + `ring-*` if emphasis needed. Never border.
- Keep transitions to `transition-[transform,background-color]` — no `box-shadow` or `border-color` in transitions.

Spacing:

- Use whitespace/padding (Gestalt Law of Proximity) to group related elements, not dividers or `border-t`/`border-b`.
- Section separation = increased margin (`mt-6`), not a line.

Implementation:

- Always read the CLAUDE.md file (if it exists) first to understand the codebase's specific rules
- Assume the project is greenfield - breaking changes are fine
- If you are implementing from a plan, then you are allowed to just go ahead and implement - this is because the plan had already been carefully crafted so you don't need to spend time thinking about it - just go ahead and do as the plan says.
- Have a deep think of the best solution, do not just jump into implementation
- I want you to consider the simplest solution first, another engineer is likely to read it so it should be simple and easy to understand, and not overly bloated with features that they will need to maintain.
- When unsure, ask for clarification before implementing.
- If requirements are ambiguous, ask clarifying questions before implementing.
- Feel free to ask AS MANY QUESTIONS AS YOU LIKE, you must have a complete end to end understand of how the user wants something to be implemented, even if the user may not know themselves.
- Prefer making a detailed plan over a quick plan
- Add comments especially for big functions and update comments (if needed) when modifying big functions- When done implementing, explain all your changes made to the user
- Check web and docs for everything you do
- If you have learnt anything new from the user, ie their preference of implementing something, then include this in the CLAUDE.md too in a short concise format
- Never use `any`
- Never use `unknown`
- Never use `as` for type assertions
- Never use the non-null assertion operator `!`.
- If a type is difficult to express, rethink the design instead of bypassing the type system.
- Prefer simplicity over cleverness.
- Minimize surface area of change.
- Co-locate logic where it naturally belongs.
- Avoid premature abstractions.
- Prefer explicit over magical behaviour.
- All decisions should optimize for long-term maintainability.
- Do not run any dev / lint / build commands unless the user asks you to

Convex:

- Never manually define interfaces for Convex documents.
- Always import:
  - `Doc<"tableName">`
  - `Id<"fieldName">`
  - `FunctionReturnType<typeof api.functionName>`
- Convex types are the single source of truth.
- If the schema changes, all consumers must update automatically.
- Never duplicate schema types manually.
- To typecheck Convex: `cd packages/backend && npx convex codegen --typecheck enable` (no dev server needed)
- Schema migration chicken-egg problem: When changing a field type with existing data, use v.union(oldType, newType) temporarily → deploy → run migration → change to only newType
- Single source of truth for table fields: Define table fields as exported `const xxxFields = { ... }` in `validators.ts`. Use in both `schema.ts` (`defineTable(xxxFields)`) and return validators (`v.object({ _id: v.id("table"), _creationTime: v.number(), ...xxxFields })`). Never duplicate field definitions between schema and return validators.

Component Structure:

- Max ~250 lines per client component
- Route-level `*Client.tsx` = thin orchestrator (queries, top-level state, layout composition)
- Route-local child components go in `_components/` folder
- Pure helper functions go in `_utils.ts` at route level
- Presentational components (no hooks, no `"use client"`) stay as plain function components
- Only add `"use client"` to child components that use hooks/interactivity
- Inline sub-components defined in the same file should be extracted to `_components/`

Next.js:

- This is a client-first app. SSR/SSG is not used. All components are client components.
- Never use `Link` from `next/link` — it adds prefetching/SSR overhead we don't need. Use `useRouter` from `next/navigation` and `router.push()` instead.
- Never use `Image` from `next/image` — the image optimization server is unnecessary overhead. Use plain `<img>` tags instead.
- When using Convex:
  - Extract interactive/live logic into child Client Components.

TanStack Router (eva web app):

- Never use `window.location.href` for navigation. Always use `useNavigate` from `@tanstack/react-router` or the `<Link>` component.
- `window.location.href` causes a full page reload, losing client-side state. TanStack Router navigation preserves SPA behavior.

Nuqs:

- If you are required to implement filters, or sort by methods, make sure nuqs is installed in the codebase and use it to create searchParams.ts and use the useQueryState/useQueryStates hook from nuqs to implement the filters / sorting methods. This is preferred over local state as it stores the state in the URL so can be shared with other users.

Husky:

- If the codebase uses Nextjs/React, make sure husky is setup with the default prettier configuration to format code before it gets committed.

Verification Rules after implementation:

- Ensure no `any`, `unknown`, or `as` exists.
- Run npx tsc in the appropriate codebase and fix any type issues (if related to your changes)
- Ensure types are inferred where possible.
- Ensure no unnecessary client components were introduced.
- Ensure CLAUDE.md is updated if architecture decisions changed and with new learnings.

Implementation Process:

- Read CLAUDE.md first (if exists)
- Understand existing architecture before changing anything.
- Identify the simplest possible solution.
- Avoid adding new dependencies unless absolutely necessary.

Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
- Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one
- Use the AskUserQuestion tool

Philosophy
This codebase will outlive you. Every shortcut becomes someone else's burden. Every ack compounds into technical debt that slows the whole team down.
ou are not just writing code. You are shaping the future of this project. The atterns you establish will be copied. The corners you cut will be cut again. Fight entropy. Leave the codebase better than you found it.

the sandboxed app is a different codebase. this current codebase is a platform for managing other codebases and running them remotely.

stop adding usestate's useref's for everything, this is the easy way out for every problem which is bad practice, first think of the best way to do this before resorting to those options

if the user asks you to run a migration, you need to add a migration function to clear the documents with that field in the db, then you run it, then you can get rid of the fields from the schema, then cleanup the migration function

if you are using the agent-browser skill, navigate to `/?agent` to auto sign in as the agent user.

Daytona Sandbox Lifecycle:

- **Stop vs Delete**: `sandbox.stop()` preserves the VM state and can be resumed with `sandbox.start()` (~14s). `sandbox.delete()` removes the entire sandbox. **Always prefer stop for reuse**.
- **Auto-stop**: Daytona auto-stops sandboxes after `autoStopInterval` (15 min) of idle. Preview URL requests reset the timer.
- **Auto-archive**: After 7 days stopped, Daytona auto-archives (moves to cheap storage). Cannot be resumed from archive.
- **Session reuse pattern**: On session close, don't manually call `sandbox.stop()`. Let Daytona auto-stop handle it. Keep `sandboxId` on the session document so next open can detect and reuse the existing sandbox. Use `ensureSandboxRunning()` to auto-resume if needed.
- **Timing**: Create from scratch = 20-26s. Resume from stopped = ~14s. This 2x speedup justifies the complexity of reuse tracking.

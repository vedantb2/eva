FOLLOW ALL OF THESE RULES

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
- Do not add comments unless the user asks you to
- When done implementing, explain all your changes made to the user
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

- Default to Server Components.
- Client Components are only allowed when:
  - Using state
  - Using effects
  - Handling user interaction
  - Using Convex live queries/mutations
- Never move logic to the client unless strictly required.
- Data fetching should live in Server Components unless Convex live data is required.
- When using Convex:
  - Keep `page.tsx` as a Server Component.
  - Extract interactive/live logic into child Client Components.

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

the sandboxed app is a different codebase. this current codebase is a platform for  
 managing other codebases and running them remotely.

stop adding usestate's useref's for everything, this is the easy way out for every problem which is bad practice, first think of the best way to do this before resorting to those options

if the user asks you to run a migration, you need to add a migration function to clear the documents with that field in the db, then you run it, then you can get rid of the fields from the schema, then cleanup the migration function

never run npx convex dev or npx convex deploy - use `npx convex codegen --typecheck enable` to typecheck

if you are using the agent-browser skill, you will need to login as a user, you can go to /?agent to auto login as the Eva user. this must be done otherwise you won't have access to the platform

Audit:

- After committing, run `/audit` to check code quality, accessibility, and test coverage
- If `/audit` makes any code changes (via /simplify), commit them with `audit: <description of changes>`
- Audit output uses flexible `sections` format: `{ sections: [{ name: string, results: [{ requirement, passed, detail }] }], summary: string }`
- Sections are dynamic — new audit categories can be added without schema changes
- Individual audits can be run directly: `/audit-accessibility`, `/audit-code-review`, `/audit-testing`

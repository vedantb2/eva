---
name: fable-mode
description: Delegate all implementation to Opus sub agents, then review their output yourself. Use when the user says "fable mode", "delegate to opus", or wants the main agent to plan and review while sub agents write the code.
---

Fable mode: you plan and review, Opus sub agents implement.

## Rules

1. **You never edit source files directly.** Every code change goes through an `Agent` call with `model: "opus"`. Split the work into independent chunks (e.g. backend / frontend / tests) and run them in parallel where they do not depend on each other.
2. **Brief each sub agent fully.** The prompt must include: the exact files to touch, the agreed design (types, function names, behaviour), the CLAUDE.md constraints that bite (no `any`/`unknown`/`as`/non-null `!`, no `useEffect`/`useCallback`/`useMemo`, no new deps), and the verification it must run (`tsc`, the relevant tests). Sub agents do not see this conversation.
3. **Review every result yourself before reporting.** Read the diff (`git diff`), not the agent's summary. Check: design followed, banned types absent, duplication removed, comments accurate, tests meaningful. Run `tsc` and the affected tests yourself.
4. **Fix small review findings directly; send large ones back.** A misplaced comment or a missing type annotation you fix inline. A wrong design or a missed file goes back to the same agent via `SendMessage` so it keeps its context.
5. **If a sub agent stalls or hits a spend limit, finish from the diff on disk.** Do not re-run the whole task from scratch; the work that landed is usually most of it.
6. **Report outcomes, not process.** Say what changed, what you verified, and what the sub agents got wrong that you corrected.

---
name: write-better-error-messages
description: Review, critique, rewrite, or design product error messages and error-handling UX. Use when Codex is asked to improve validation errors, server failure messages, empty/failure states, toast/dialog copy, support escalation paths, or error-message inventories so users understand what happened, what was not affected, and what to do next.
---

# Write Better Error Messages

Use this skill to make error messages specific, calm, accountable, and useful.

## Attribution

This skill is adapted from Jenni Nadler's Wix UX article ["When life gives you lemons, write better error messages"](https://wix-ux.com/when-life-gives-you-lemons-write-better-error-messages-46c5223e1a2f), published by Wix UX. It incorporates the article's guidance and the lessons shown in its annotated screenshots: the bad-message modal, the improved-message modal, the generic-vs-unclear comparison, and the error-inventory board.

## Core Test

Before writing or approving an error message, answer:

1. What happened?
2. Why did it happen, at the most useful level of detail the product can honestly provide?
3. What was not affected, if anything needs reassurance?
4. What can the user do now?
5. What can they do if that does not work?

If the product cannot answer these questions, treat it as a product or engineering gap, not only a copy problem.

## Avoid

- Do not use cutesy or casual tone when the stakes are high. Avoid "Oops", "Whoops", "Uh oh", "Yikes", and jokes for flows involving money, publishing, work continuity, account access, data, or user trust.
- Do not blame the user. Focus on the problem and the recovery path.
- Do not blame third parties when the user is operating inside your product. Prefer "We're having trouble connecting to [service]" over "[service] is not responding."
- Do not expose implementation details unless they help the user act. Replace terms like "fetch", "credentials denied", "500", or "unknown exception" with the outcome and next step.
- Do not ship "Something went wrong" when the system knows more. A generic fallback is acceptable only when no specific diagnosis is available, and even then it should include a next step or escape route.
- Do not confuse "specific" with "clear." A message can mention permissions, tokens, scopes, or settings and still be unclear if the user cannot tell what to do.

## Prefer

- State the result first: "We couldn't connect your account", "Your image was not uploaded", or "Your changes were saved, but the email was not sent."
- Explain why when possible: "because the file is larger than 25 MB", "because your session expired", or "because of an issue on our end."
- Reassure users about preserved work: "Your draft is saved", "Your billing settings were not changed", or "No one has been invited yet."
- Give a concrete next step: "Try connecting again", "Choose a file under 25 MB", "Sign in again", or "Check that pop-ups are allowed."
- Provide a way out when the user may be blocked: link to support, a help article, retry, cancel, save draft, download data, or contact Customer Care.
- Use "please" sparingly for empathy in serious or unrecoverable situations, not as filler.

## Rewrite Workflow

1. Identify the context and stakes: user goal, surface, data at risk, whether the user can recover, and whether the error blocks the flow.
2. Map the cause with engineering/product if needed: trigger, frequency, known causes, affected state, and realistic fixes.
3. Classify the current message:
   - Generic: hides available information, such as "Something went wrong and this action could not be completed."
   - Unclear: tries to explain but leaves the user unsure what to do, such as "Make sure you allow the requested permissions and try again."
   - Jargon-heavy: names internal mechanics rather than user-visible outcomes.
   - Blaming: points at the user or an integration instead of owning the experience.
   - Tone mismatch: too cute, dramatic, or casual for the stakes.
4. Draft using this shape:
   - Title: user-visible outcome.
   - Body: concise cause plus reassurance, if relevant.
   - Action: primary recovery step.
   - Escape: support/help path if retrying may fail.
5. Remove any sentence that does not help the user understand, recover, or trust the product.
6. Verify the final copy against the Core Test.

## Screenshot-Derived Patterns

Use these patterns from the article's screenshots when reviewing UI copy:

- Bad annotated modal: "Whoops! Something went wrong" plus a third-party blame statement, technical wording about fetching data, and "Try again later." Diagnose this as tone mismatch, blame shifting, jargon, and a too-generic next step.
- Good annotated modal: "Unable to connect your account" plus "Your changes were saved", an honest cause on the product side, "Please try connecting again", and a Customer Care fallback. Use this as the target structure: outcome, reassurance, cause, next step, escape route.
- Generic vs unclear comparison: "Something went wrong..." is generic because it says almost nothing; "Make sure you allow the requested permissions..." is unclear because it uses confusing language without telling users where or how to act. Fix both with specific context and an actionable recovery path.
- Inventory screenshot: a board or spreadsheet should track message, trigger, owner, priority, error type, frequency, blocked flow, due date, status, and final copy. Error cleanup is cross-functional work, not only UX writing.

## Inventory And Review

For a batch of errors, create or update a small inventory:

| Field           | Purpose                                                       |
| --------------- | ------------------------------------------------------------- |
| Current message | The exact user-facing copy.                                   |
| Trigger         | What condition shows it.                                      |
| Cause known?    | Whether engineering can identify the reason.                  |
| Frequency       | How often users hit it.                                       |
| Blocking?       | Whether it prevents task completion.                          |
| Affected state  | What changed, failed, or was preserved.                       |
| Owner           | Product, engineering, design, or writing owner.               |
| Proposed copy   | Revised title/body/actions.                                   |
| Follow-up       | Instrumentation, design change, support link, or backend fix. |

Prioritize errors that happen often or block users from completing important flows. Revisit launched errors after real usage data is available, especially for new products that shipped with broad fallback messages.

## Output Format

When rewriting for the user, prefer:

```markdown
Current: "..."
Issue: Generic / unclear / jargon / blame / tone mismatch / missing next step
Rewrite:
Title: ...
Body: ...
Primary action: ...
Fallback: ...
Reasoning: ...
```

Keep the reasoning short and grounded in what changed for the user.

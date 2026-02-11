Define Outcomes, Not Procedures
Over-instruction degrades agent behavior.
Avoid:
Step-by-step plans
Tool-level micromanagement
Predefined execution graphs
Instead:
Define the desired outcome
Define acceptance criteria
Define constraints
Then stop.
Planning and execution belong to the agent.
Human intervention during execution usually degrades results and masks real system flaws.

The question is whether that covers everything useful for testing. A few things to consider:

- User flows vs requirements overlap — a user flow like ["Click login", "Enter credentials", "See dashboard"] is
  implicitly a requirement (this flow should work). Do we evaluate flows separately from requirements, or are flows
  just context and only requirements get checked?
- Edge cases / error states — things like "shows error when email is invalid" — do these go under requirements,  
  or is that a separate section?
- Preconditions — "user must be logged in", "repo must be connected" — useful for the evaluator to know setup  
  context

The simplest structure that works might just be:

1. Description — what this page/feature does (string)
2. User flows — the happy paths a user walks through (2D array)
3. Requirements — the checklist that gets evaluated (array of strings)

Flows give the evaluator context about how the feature works. Requirements are the actual pass/fail checklist.  
 Edge cases and error handling go under requirements.

edge cases:
empty states:
error scenarios:
boundary conditions:
conflicting inputs:

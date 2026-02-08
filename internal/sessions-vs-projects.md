# Sessions vs Projects

## Sessions (Interactive, Lightweight)

User has an **initial idea** and wants to develop it iteratively.

- Three modes: Execute (make changes), Ask (read-only Q&A), PRD (lightweight product requirements)
- PRD mode: free-form conversation to define requirements, user approves then switches to execute
- One conversation, one branch, manual control
- User drives each step by sending messages one at a time
- Best for: quick changes, bug fixes, small features, exploring/developing ideas

## Projects (Autonomous, Structured)

User has the **final idea** and wants to know how to get there, including edge cases.

- Structured interview flow (multiple choice questions) builds a comprehensive spec
- Auto-generates a task breakdown from the spec
- Executes ALL tasks autonomously without user input per task
- Has lifecycle phases (draft → finalized → active → completed)
- Best for: large features, multi-file changes, "build this and come back when it's done"

## Differentiators

### Discovery & Planning

- **Edge case probing** — Projects actively discover edge cases, error states, and unknowns through the interview. Session PRD only covers what the user thinks to mention.
- **Spec diffing** — Projects show a diff of what changed between spec iterations, so stakeholders can track exactly what evolved.
- **Requirement scoring** — Projects rate each requirement by complexity/risk, helping prioritize what to build first.

### Execution

- **Multi-task breakdown with progress tracking** — Projects split the spec into individual tasks on a checklist/kanban with real-time progress. Sessions just execute one message at a time.
- **Parallel task execution** — Independent project tasks could run simultaneously in separate sandboxes.
- **Automatic validation** — Projects run tests or checks after each task to verify the work before moving to the next. Sessions don't validate.
- **Rollback per task** — If a project task goes wrong, revert just that task without losing others.

### Delivery

- **Auto-generated PR with full changelog** — Projects produce a polished PR with a summary of all changes across all tasks. Sessions are just a branch.
- **Auto-generated docs** — Projects write documentation for what was built based on the spec.
- **Cost/token tracking** — Projects track total spend across all tasks so you know the cost of building a feature.

### Collaboration

- **Approval gates** — Projects pause at checkpoints for stakeholder review before continuing to the next phase.
- **Multiple reviewers** — Assign different team members to review different parts of the project.

## UX Differentiation (Active Project vs Session Layout)

Both use the same core components (sandbox/preview, chat, task list) but the emphasis and organization should feel different:

- **Task-driven navigation** — Clicking a task in the left panel scopes the center and right panels to that task. Preview shows that task's changes, diffs show that task's files, chat is about that task. In sessions, everything is one continuous stream.
- **Progress header** — A top bar showing overall progress (3/8 tasks, current task name, elapsed time) that doesn't exist in sessions. Makes it immediately feel like a dashboard.
- **Task status indicators** — The left panel shows rich status per task (pending/running/done/failed with icons), expandable subtasks, per-task diffs. Sessions just have a flat message list.
- **Chat is intervention, not primary input** — The chat only activates when the user needs to correct something. Could default to collapsed or show as a "Fix this task" action. In sessions, chat is always the primary interface.
- **Auto-scrolling build log** — Instead of streaming into a chat bubble, show a real-time build log for the currently running task in the center panel.

Summary: Sessions = **flat conversation with a sandbox beside it**, Projects = **task list driving a scoped sandbox + intervention chat**.

## Example Use Cases

### Projects

- "I want an admin page that shows a list of users and gives me the option to ban them"
- "Build a notification system with email and in-app alerts"
- "Add Stripe billing with subscription plans, usage tracking, and invoices"
- "Create a settings page with profile editing, password change, and notification preferences"

### Sessions (Execute/Ask)

- "Fix the login button not working on mobile"
- "Add a dark mode toggle to the navbar"
- "Why is the /users endpoint returning 500?"
- "Rename the 'Projects' tab to 'Features' across the app"

### Sessions (PRD mode)

- "I want to add a search bar somewhere on the dashboard — help me think through where it should go and what it should search"
- "We're thinking about adding a feedback widget — what should it capture and where should it live?"
- "I want users to be able to export their data — let's figure out what formats and what data to include"
- "We need some kind of onboarding flow for new users — help me define what steps it should have"

### Rule of Thumb

If you can describe it in one sentence and expect it done in one step → **Session**.
If you'd write a ticket with acceptance criteria and expect multiple changes → **Project**.

## Key Takeaway

The strongest differentiators are **multi-task breakdown + autonomous execution** and **structured interview with edge case discovery**. Keep sessions interactive and lightweight, keep projects autonomous and structured. Don't merge them.

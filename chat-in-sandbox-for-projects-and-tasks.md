# Chat-in-sandbox for projects and tasks

## Context

Today, sessions, projects, and quick tasks are independent. Sessions are chat + sandbox; projects and tasks have sandboxes but no chat. When a user is viewing a project/task sandbox and wants to ask Eva a question about the running code, there's no in-context way to do it — they'd have to leave for a separate session that doesn't know about the parent.

Feedback agreed sessions and projects feel overlapping. Resolution: bring the session-style two-pane layout (`ResizablePanelLayout(<Chat />, <Sandbox />)`) into the project and task sandbox views. Chat reuses the parent's existing sandbox (no new provisioning). One persistent chat per project, one per task. Entry point is the existing View Sandbox button — no new "Ask Eva" button. Standalone sessions stay unchanged.

Rollout: project + task chat in a single PR. Backend duplicates session workflow patterns rather than introducing a polymorphic dispatcher.

## Approach

1. Extend the `messages` / `queuedMessages` `parentId` unions to accept `Id<"projects">` and `Id<"agentTasks">`.
2. Mirror the session message + workflow pipeline for projects and tasks (duplicate, do not abstract).
3. Extract a parent-agnostic `<ChatBody>` from `sessions/ChatPanel.tsx`; build thin wrappers per parent type.
4. Convert project and task sandbox views from full-width sandbox panels to the same two-pane layout used in sessions.

## Schema changes

**File:** `packages/backend/convex/_validators/tableFields.ts`

- `messageFields.parentId`: extend union to `v.union(v.id("sessions"), v.id("designSessions"), v.id("projects"), v.id("agentTasks"))`.
- `queuedMessageFields.parentId`: same extension.

Existing rows are unaffected (union widening is backwards-compatible).

**File:** `packages/backend/convex/_validators/tableFields.ts` — `projectFields` and `agentTaskFields`

- Add `activeChatWorkflowId: v.optional(v.id("_scheduled_functions"))` to both. Prevents concurrent chat workflow runs without conflicting with existing `activeBuildWorkflowId` / `activeWorkflowId`.

## Backend changes

### Message + workflow plumbing (duplicate session patterns)

**New files:**

- `packages/backend/convex/projectChatWorkflow.ts` — mirror of `sessionWorkflow.ts`. Exports `startExecute({ projectId })`. Runs the agent against `project.sandboxId`, with project context (tasks, generatedSpec, conversationHistory) injected into the system prompt. Streams to `entityId = projectId`. Patches `project.activeChatWorkflowId` for concurrency.
- `packages/backend/convex/agentTaskChatWorkflow.ts` — mirror of `sessionWorkflow.ts`. Exports `startExecute({ taskId })`. Runs the agent against `agentTask.sandboxId`, with task context (description, tags, status) injected. Streams to `entityId = taskId`. Patches `agentTask.activeChatWorkflowId`.

**Modified files:**

- `packages/backend/convex/projects.ts` — add `addMessage({ projectId, content })` mutation. Mirrors `sessions.addMessage`. Inserts a `messages` row with `parentId = projectId`, enqueues into `queuedMessages`.
- `packages/backend/convex/agentTasks.ts` — add `addMessage({ taskId, content })` mutation. Same shape for tasks.
- `packages/backend/convex/queuedMessages.ts` — `listByParent` currently does `parent.repoId` lookup assuming the parent is a session or designSession. Make this resolve `repoId` for any parent type. Project and agentTask both have `repoId`, so the resolver is straightforward: `parent.repoId` after a `db.get`. Verify access via `hasRepoAccess`.
- `packages/backend/convex/_queues/helpers.ts` — add `startNextQueuedProjectMessage` and `startNextQueuedTaskMessage` (mirror existing session/designSession helpers). Wire the queue dispatcher to route by parent type.

### Streaming

`streaming.ts` already accepts arbitrary string `entityId`. No changes needed. Conventions:

- Project chat activity → `entityId = projectId`
- Task chat activity → `entityId = taskId`

These don't collide with existing streaming keys (project builds use a separate entityId).

## Frontend changes

### Extract parent-agnostic chat component

**New file:** `apps/web/src/lib/components/chat/ChatBody.tsx`

Extract from `apps/web/src/routes/_repo/$owner/$repo/sessions/ChatPanel.tsx`:

- Messages list rendering
- Input + submit (calls injected `onSend(content)`)
- Streaming display (`entityId` injected)
- Queued messages display

Props:

```ts
type ChatBodyProps = {
  parentId: string;
  messages: Doc<"messages">[];
  queuedMessages: Doc<"queuedMessages">[];
  streamingEntityId: string;
  onSend: (content: string) => Promise<void>;
  isWorkflowActive: boolean;
};
```

Session-specific features (summarize, plan approval, PR creation buttons, summary/startup streaming) stay in `sessions/ChatPanel.tsx`, rendered around `<ChatBody>`.

### Per-parent chat wrappers (new files)

- `apps/web/src/lib/components/projects/ProjectChatPanel.tsx` — wraps `<ChatBody>`. Queries `api.messages.listByParent({ parentId: projectId })` and `api.queuedMessages.listByParent`. `onSend` calls `api.projects.addMessage` then `api.projectChatWorkflow.startExecute`. Reads `project.activeChatWorkflowId` for `isWorkflowActive`.
- `apps/web/src/lib/components/tasks/TaskChatPanel.tsx` — same shape for tasks, calls task equivalents.

### Sessions chat panel refactor

**File:** `apps/web/src/routes/_repo/$owner/$repo/sessions/ChatPanel.tsx`

Becomes a thin shell: renders session-specific chrome (summary, plan approval, PR controls) plus `<ChatBody>` with session mutations. No behaviour change for users.

### Project sandbox view layout

**File:** `apps/web/src/routes/_repo/$owner/$repo/projects/ProjectDetailClient.tsx`

In the `surface === "sandbox"` branch (currently renders `ProjectSandboxPanel` full-width):

1. Move the **Back to Tasks** button out of the in-body header strip and into the `PageWrapper`'s `headerRight` slot (alongside the existing sandbox status indicators). The in-body strip can then be removed so the two-pane layout occupies the full body height.
2. Replace the panel area with:

```tsx
<ResizablePanelLayout
  storageKey="project-sandbox-split"
  leftPanel={() => <ProjectChatPanel projectId={typedProjectId} />}
  rightPanel={<ProjectSandboxPanel ... />}
/>
```

### Task sandbox view layout

**File:** `apps/web/src/lib/components/tasks/TaskDetailInline.tsx`

In the `showSandbox && (isSandboxActive || isSandboxStarting || isSandboxStopping)` branch:

Wrap the existing `<TaskSandboxPanel>` in `<ResizablePanelLayout>` with `<TaskChatPanel taskId={taskId} />` on the left. Keep the header (back to details, stop sandbox).

### Reuse-able pieces already in place

- `ResizablePanelLayout` (`apps/web/src/lib/components/ResizablePanelLayout.tsx`) — generic, no changes.
- `api.messages.listByParent` — already polymorphic, accepts any union-member parentId.
- `api.streaming.get` — already accepts any string entityId.

## Sandbox handling

Chat panels do **not** manage sandbox lifecycle. They read `parent.sandboxId` to know where the agent should execute, but starting/stopping the sandbox remains the responsibility of the surrounding view (`ProjectDetailClient` header buttons, `TaskDetailInline` header).

If chat is opened with no active sandbox (shouldn't happen via View Sandbox path, but defensively): show an inline message in the chat pane explaining that the sandbox must be running.

## Migration considerations

No data migration required — the union extension is additive. Existing messages with session/designSession parents remain valid.

## Verification

**Typecheck:**

- `cd packages/backend && npx convex codegen --typecheck enable`
- `cd apps/web && npx tsc --noEmit`

**End-to-end (manual):**

1. Open a project. Click **Build Project** to spin up a sandbox (or use an existing active project).
2. Click **View Sandbox** → confirm new two-pane layout: chat on left, sandbox tabs (preview/terminal) on right.
3. Type a question in chat → response streams from Eva, runs in the project's existing sandbox, no new sandbox provisioning.
4. Send a second message → confirm it queues correctly while first runs.
5. Close the sandbox view, reopen → chat history persists.
6. Repeat for a quick task with an active sandbox.
7. Open a standalone session → confirm unchanged behaviour (no regressions).
8. Send a chat message in a project while a build workflow is also running → confirm `activeChatWorkflowId` prevents conflict, and the build workflow is independent.

**Schema verification:**

- Confirm `messages.parentId` and `queuedMessages.parentId` accept all four parent types.
- Confirm `projects` and `agentTasks` documents accept the new `activeChatWorkflowId` field.

## Out of scope (for follow-up)

- "Turn this chat message into a task" affordance.
- Polymorphic workflow dispatcher (chosen duplicate-pattern path; revisit when there are 3+ parent types and duplication hurts).
- Read-only / cheap Q&A mode (chat currently requires an active sandbox).
- Cross-mode discovery (e.g., "related sessions" tab on a project).

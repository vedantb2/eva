# Plan: Sandbox Component for Research Queries

## Context

Research queries currently display generated Convex code in plain `<pre><code>` blocks with no syntax highlighting, no status indicators, and a basic collapsible for viewing code after execution. The [AI SDK Sandbox component](https://elements.ai-sdk.dev/components/sandbox) provides a structured way to display code alongside execution output with tabs and status badges — we'll build a custom version following the existing AI Elements patterns.

## Files to Create

### 1. `packages/ui/src/ai-elements/code-block.tsx`

Reusable code display primitive (~35 lines). No syntax highlighting library — just well-styled `<pre><code>` with a copy button. Structure:

- **`CodeBlock`** — root container. Props: `{ code: string; language?: string }`. Provides `CodeBlockContext` so children can access `code`.
- **`CodeBlockCopyButton`** — reads code from context, copies to clipboard, shows check icon for 2s.

Default rendering (when no children): `<pre>` with monospace font, `bg-secondary`, rounded, overflow-x-auto.

### 2. `packages/ui/src/ai-elements/sandbox.tsx`

Container component with status badges and collapsible body (~70 lines). Structure:

- **`Sandbox`** — wraps Radix `Collapsible`. Props: `{ state: "pending" | "running" | "completed" | "error" }`. Provides `SandboxContext`.
- **`SandboxHeader`** — wraps `CollapsibleTrigger`. Props: `{ title?: string }`. Shows chevron + title + status badge (pending=warning, running=blue+pulse, completed=success, error=destructive).
- **`SandboxContent`** — wraps `CollapsibleContent`. Thin pass-through with border-top.
- **`SandboxTabs`** — wraps Radix `Tabs`.
- **`SandboxTabsList`** — wraps `TabsList` with inline border-bottom style (not pill bg).
- **`SandboxTabsTrigger`** — wraps `TabsTrigger`, smaller text.
- **`SandboxTabContent`** — wraps `TabsContent` with padding.

Uses existing `Badge` (with `warning`/`success`/`destructive`/`secondary` variants), `Collapsible`, and `Tabs` from `packages/ui`.

## Files to Modify

### 3. `packages/ui/src/index.ts`

Add two export lines:

```
export * from "./ai-elements/code-block";
export * from "./ai-elements/sandbox";
```

### 4. `apps/web/app/(main)/[repo]/analyse/query/[id]/QueryDetailClient.tsx`

Three changes:

**A. Pending state (lines 230-233)** — Replace `<pre><code>` inside `ConfirmationRequest`:

```tsx
// Before
<pre className="rounded-lg bg-secondary p-3 text-xs overflow-x-auto">
  <code>{message.content}</code>
</pre>

// After
<Sandbox state="pending" defaultOpen>
  <SandboxHeader title="query.ts" />
  <SandboxContent>
    <CodeBlock code={message.content} language="typescript" />
  </SandboxContent>
</Sandbox>
```

Stays inside `Confirmation` — Cancel/Run buttons remain unchanged.

**B. Completed state (lines 264-311)** — Replace `MessageResponse` + Collapsible with a single Sandbox containing Code + Output tabs:

```tsx
// Before: MessageResponse above + Collapsible "View query" below

// After
<Sandbox state="completed">
  <SandboxHeader title="query.ts" />
  <SandboxContent>
    <SandboxTabs defaultValue="output">
      <SandboxTabsList>
        <SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
        <SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
      </SandboxTabsList>
      <SandboxTabContent value="output">
        <MessageResponse ...>{message.content}</MessageResponse>
      </SandboxTabContent>
      <SandboxTabContent value="code">
        <CodeBlock code={message.queryCode} language="typescript">
          <CodeBlockCopyButton />
          <pre>...</pre>
        </CodeBlock>
        {/* Save query button stays here */}
      </SandboxTabContent>
    </SandboxTabs>
  </SandboxContent>
</Sandbox>
```

Default tab is "Output" (the analysis) since that's what users want to see first.

**C. Saved queries panel (lines 413-416)** — Replace `<pre><code>` with `<CodeBlock>` for consistency.

### 5. `internal/changelog.md`

Add entry for this feature.

## Verification

1. Run `npx tsc` in `apps/web` — no type errors
2. Open `/analyse/query/[id]` page
3. Send a research question → verify pending state shows Sandbox with code + status badge
4. Click "Run query" → verify completed state shows Sandbox with Output/Code tabs
5. Click "Code" tab → verify code displays with copy button
6. Click "Save query" → verify it still works
7. Check saved queries panel → verify CodeBlock renders correctly

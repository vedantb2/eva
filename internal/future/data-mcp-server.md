# Eva Database Query Feature - Final Plan

## Summary

Replace the heavyweight sandbox-based query execution with:

1. **Direct AI SDK** for streaming query generation
2. **Confirmation dialog** before execution
3. **Lightweight MCP process** for query execution (no sandbox/repo clone)

---

## User Flow

```
1. User asks: "How many tasks were completed last week?"
         ↓
2. Eva streams reasoning + generates JavaScript query
         ↓
3. Confirmation dialog shows query + explanation
         ↓
4a. User approves → MCP executes query → results streamed back
4b. User declines → Eva asks for adjustments → back to step 2
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  QueryDetailClient.tsx                                          │
│  - Streaming message display                                     │
│  - QueryConfirmation component                                   │
│  - Handles approve/reject actions                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Route                                     │
│  /api/analyse/query/stream                                       │
│  - Mode 1: Generate query (AI SDK + streaming)                   │
│  - Mode 2: Execute query (spawn MCP process)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                              ▼
┌─────────────────────┐      ┌─────────────────────┐
│    Anthropic API    │      │   Convex MCP        │
│  (query generation) │      │   (query execution) │
│  - Streaming        │      │   - Process spawn   │
│  - Tool calling     │      │   - runOneoffQuery  │
└─────────────────────┘      └─────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Streaming API Route

**File:** `web/app/api/analyse/query/stream/route.ts`

```typescript
export async function POST(req: Request) {
  const { queryId, question, repoId, confirmedQuery } = await req.json();

  if (confirmedQuery) {
    // EXECUTE MODE: Run query via MCP
    return executeQueryWithMCP(confirmedQuery, repoId);
  }

  // GENERATE MODE: Stream AI response
  return streamQueryGeneration(question, repoId, queryId);
}

async function streamQueryGeneration(
  question: string,
  repoId: string,
  queryId: string,
) {
  const result = await streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: QUERY_SYSTEM_PROMPT, // includes schema + repoId
    messages: [{ role: "user", content: question }],
    tools: {
      generateQuery: {
        description: "Generate a Convex query to answer the user question",
        parameters: z.object({
          query: z.string().describe("JavaScript code for runOneoffQuery"),
          explanation: z.string().describe("Human-readable explanation"),
        }),
      },
    },
  });

  return result.toDataStreamResponse();
}

async function executeQueryWithMCP(query: string, repoId: string) {
  // Spawn MCP process, execute query, stream results
  const mcp = spawn("npx", ["convex", "mcp", "start"], {
    env: {
      CONVEX_DEPLOYMENT: serverEnv.CONVEX_DEPLOYMENT,
      CONVEX_DEPLOY_KEY: serverEnv.CONVEX_DEPLOY_KEY,
    },
  });

  // Send query via MCP JSON-RPC protocol
  // Inject repoId filter for security
  // Return results as stream
}
```

### Step 2: Create MCP Executor Utility

**File:** `web/lib/analyse/mcp-executor.ts`

```typescript
export async function executeMCPQuery(
  query: string,
  repoId: string,
): Promise<unknown[]> {
  // 1. Validate query (no mutations, has repoId reference)
  validateQuery(query, repoId);

  // 2. Start MCP process
  const mcp = startMCPProcess();

  // 3. Send runOneoffQuery request via JSON-RPC
  const result = await sendMCPRequest(mcp, "runOneoffQuery", { query });

  // 4. Kill process
  mcp.kill();

  // 5. Limit results
  return Array.isArray(result) ? result.slice(0, 100) : result;
}

function validateQuery(query: string, repoId: string) {
  // Check query references correct repoId
  if (!query.includes(repoId)) {
    throw new Error("Query must be scoped to current repository");
  }
  // Check no mutation keywords
  const forbidden = ["insert", "patch", "replace", "delete"];
  if (forbidden.some((f) => query.toLowerCase().includes(f))) {
    throw new Error("Only read operations allowed");
  }
}
```

### Step 3: Update QueryDetailClient.tsx

**File:** `web/app/(main)/[repo]/analyse/query/[id]/QueryDetailClient.tsx`

Changes:

- Use `useChat` from ai-sdk for streaming
- Add state for pending query confirmation
- Render `QueryConfirmation` component when query generated
- Handle approve/reject actions

```typescript
// Key state additions
const [pendingQuery, setPendingQuery] = useState<{query: string, explanation: string} | null>(null);

// Handle tool call results from stream
useEffect(() => {
  if (lastToolCall?.name === 'generateQuery') {
    setPendingQuery(lastToolCall.args);
  }
}, [lastToolCall]);

// Render confirmation when pending
{pendingQuery && (
  <QueryConfirmation
    query={pendingQuery.query}
    explanation={pendingQuery.explanation}
    onConfirm={handleConfirm}
    onReject={handleReject}
  />
)}
```

### Step 4: Create QueryConfirmation Component

**File:** `web/lib/components/query/QueryConfirmation.tsx`

```tsx
export function QueryConfirmation({
  query,
  explanation,
  onConfirm,
  onReject,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <h3>Eva wants to run this query</h3>
        <p>{explanation}</p>
      </CardHeader>
      <CardBody>
        <CodeBlock language="javascript">{query}</CodeBlock>
      </CardBody>
      <CardFooter>
        <Button color="primary" onPress={onConfirm}>
          Run Query
        </Button>
        <Button variant="flat" onPress={onReject}>
          Adjust
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Step 5: Create System Prompt

**File:** `web/lib/prompts/query-prompt.ts`

```typescript
export const QUERY_SYSTEM_PROMPT = `You are Eva, an analytics assistant.

Generate Convex queries to answer user questions about their repository data.

## Available Tables
- agentTasks: { _id, repoId, title, description, status, branchName, prNumber, createdAt, updatedAt }
- agentRuns: { _id, taskId, repoId, status, startedAt, completedAt, logs }
- sessions: { _id, repoId, title, messages, sandboxId, createdAt }
- projects: { _id, repoId, title, status, phases, createdAt }
- boards: { _id, repoId, title, columns }
- docs: { _id, repoId, title, content, type }

## Query Format
Use the generateQuery tool with:
- query: JavaScript code for Convex runOneoffQuery
- explanation: Brief human-readable description

IMPORTANT: Always filter by the provided repoId: "${REPO_ID}"

Example query:
\`\`\`javascript
const tasks = await ctx.db.query("agentTasks")
  .filter(q => q.eq(q.field("repoId"), "${REPO_ID}"))
  .filter(q => q.eq(q.field("status"), "done"))
  .collect();
return { count: tasks.length, tasks };
\`\`\`
`;
```

### Step 6: Update Message Schema (optional)

**File:** `backend/convex/schema.ts`

If we want to persist query confirmations and results in message history:

```typescript
// Add to researchQueries.messages validator
messages: v.array(
  v.union(
    v.object({
      role: v.literal("user"),
      content: v.string(),
      timestamp: v.number(),
    }),
    v.object({
      role: v.literal("assistant"),
      content: v.string(),
      timestamp: v.number(),
    }),
    v.object({
      role: v.literal("query"),
      query: v.string(),
      explanation: v.string(),
      timestamp: v.number(),
    }),
    v.object({
      role: v.literal("result"),
      data: v.any(),
      timestamp: v.number(),
    }),
  ),
);
```

---

## Files Summary

| File                                                             | Action            | Description                                         |
| ---------------------------------------------------------------- | ----------------- | --------------------------------------------------- |
| `web/app/api/analyse/query/stream/route.ts`                      | Create            | Streaming endpoint for query generation + execution |
| `web/lib/analyse/mcp-executor.ts`                                | Create            | MCP process management for query execution          |
| `web/lib/prompts/query-prompt.ts`                                | Create            | System prompt with schema for Eva                   |
| `web/lib/components/query/QueryConfirmation.tsx`                 | Create            | Confirmation dialog UI                              |
| `web/app/(main)/[repo]/analyse/query/[id]/QueryDetailClient.tsx` | Modify            | Add streaming + confirmation flow                   |
| `backend/convex/schema.ts`                                       | Modify (optional) | Add query/result message types                      |

---

## Security Measures

1. **Repo scoping:** Validate query includes correct repoId
2. **Read-only:** Block mutation keywords (insert, patch, delete)
3. **User confirmation:** No query runs without explicit approval
4. **Result limits:** Cap at 100 rows
5. **Timeout:** 30s query timeout
6. **Audit:** Store queries in message history

---

## Verification Plan

1. Send question → verify Eva generates query with streaming
2. Check confirmation dialog appears with query + explanation
3. Click "Run Query" → verify MCP executes and streams results
4. Click "Adjust" → verify Eva asks for feedback
5. Test with different repo → verify query is scoped correctly
6. Test mutation attempt → verify it's blocked
7. Test large result set → verify truncation

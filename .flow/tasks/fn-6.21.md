# fn-6.21 Create OpenRouter API route for chat streaming

## Description

Create the OpenRouter API route for AI chat streaming.

### Implementation

```typescript
// web/app/api/chat/route.ts
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();
  
  const result = streamText({
    model: openrouter("anthropic/claude-3.5-sonnet"),
    system: systemPrompt,
    messages,
  });
  
  return result.toDataStreamResponse();
}
```

### Key Points
- Use AI SDK with OpenRouter provider
- Stream responses for real-time chat UX
- Accept system prompt from client for flexibility
- Handle errors gracefully

### Files to Create
- `web/app/api/chat/route.ts`

### Environment
- Requires OPENROUTER_API_KEY in .env
## Acceptance
- [ ] TBD

## Done summary
Created OpenRouter API route with streaming chat endpoint using AI SDK
## Evidence
- Commits:
- Tests:
- PRs:
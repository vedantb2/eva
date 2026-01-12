# fn-6.18 Create PlanConversation component for AI chat interface

## Description

Create the PlanConversation component for AI chat interface on the plan page.

### Implementation

Uses AI SDK's useChat hook for streaming conversation:

```typescript
// web/lib/components/plan/PlanConversation.tsx
import { useChat } from "ai/react";

export function PlanConversation({ planId, onSpecGenerated }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      systemPrompt: SPEC_GENERATION_PROMPT,
    },
    onFinish: (message) => {
      // Check if spec was generated, call onSpecGenerated
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <Textarea value={input} onChange={handleInputChange} />
        <Button type="submit" isLoading={isLoading}>Send</Button>
      </form>
    </div>
  );
}
```

### Key Points
- Use AI SDK's useChat for streaming
- Display messages in chat format
- Save conversation to Convex on each message
- Detect when AI generates final spec

### Files to Create
- `web/lib/components/plan/PlanConversation.tsx`
- `web/lib/components/plan/ChatMessage.tsx`
## Acceptance
- [ ] TBD

## Done summary
Created PlanConversation component with AI SDK useChat hook, ChatMessage component, and proper Convex integration for saving messages
## Evidence
- Commits:
- Tests:
- PRs:
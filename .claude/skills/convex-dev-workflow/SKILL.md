---
name: convex-dev-workflow
description: Execute long-running code flows durably with built-in retries, delays, and state persistence across function interruptions. Use when working with durable-functions features, Workflow.
---

# Workflow

## Instructions

Workflow is a Convex component that provides execute long-running code flows durably with built-in retries, delays, and state persistence across function interruptions.

### Installation

```bash
npm install @convex-dev/workflow
```

### Capabilities

- Eliminate manual retry logic with configurable backoff strategies and error handling
- Persist workflow state automatically across function timeouts and database interruptions
- Build complex multi-step processes without managing intermediate state storage
- Resume workflows from exact failure points without losing progress or duplicating work

## Examples

### how to handle long running processes in Convex functions

The Workflow component enables you to break long-running processes into durable steps that persist across function timeouts. Each workflow step executes with automatic retries and state preservation, allowing complex operations to complete reliably even if individual function calls fail or timeout.

### Convex function retry logic with delays

Workflow provides built-in retry mechanisms with configurable delays between attempts. You can define custom backoff strategies and specify which errors should trigger retries, eliminating the need to implement retry logic manually in your Convex functions.

### durable function execution Convex

Workflows execute durably by persisting their state to the Convex database between steps. If a function is interrupted or fails, the workflow resumes from the last completed step rather than restarting from the beginning, ensuring reliable execution of multi-step processes.

### multi-step process state management Convex

The Workflow component automatically manages intermediate state for multi-step processes. You define workflow steps as regular functions, and the component handles state persistence, progress tracking, and coordination between steps without requiring manual state management code.

## Troubleshooting

**How does Workflow handle function timeouts in Convex?**

The Workflow component automatically persists workflow state to the database before each step executes. When a function times out, the workflow can resume from the last completed step rather than restarting entirely, ensuring progress is never lost during long-running operations.

**Can I customize retry behavior for different types of errors?**

Yes, Workflow allows you to configure retry strategies including which error types should trigger retries, maximum retry attempts, and delay patterns between retries. You can define different retry policies for different workflow steps based on your specific error handling needs.

**What happens to workflow state if my Convex function crashes?**

Workflow state is persisted to the Convex database after each step completes successfully. If a function crashes or is interrupted, the workflow will resume from the last successfully completed step when it runs again, preserving all intermediate results and progress.

**How do I pass data between workflow steps?**

The Workflow component automatically manages data flow between steps through its state persistence mechanism. Return values from completed steps are stored and made available to subsequent steps, eliminating the need to manually manage intermediate data storage or retrieval.

**Can workflows call other Convex functions like mutations and queries?**

Yes, workflow steps can call other Convex functions including mutations, queries, and actions. The Workflow component ensures these calls are made durably, with proper error handling and retry logic applied to maintain consistency across your application's data operations.

## Resources

- [npm package](https://www.npmjs.com/package/%40convex-dev%2Fworkflow)
- [GitHub repository](https://github.com/get-convex/workflow)
- [Convex Components Directory](https://www.convex.dev/components/workflow)
- [Convex documentation](https://docs.convex.dev)

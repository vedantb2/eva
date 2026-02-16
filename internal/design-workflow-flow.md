# Design Session Workflow Flow

## Convex + Daytona Interaction

1. **User sends message** → frontend calls `executeMessage` mutation on Convex

2. **Convex mutation** (`designSessions.executeMessage`) → adds user message + empty assistant message to session, starts the Convex workflow via `workflow.start()`

3. **Workflow Step 1** (`step.runQuery`) → fetches session data, repo info, persona, builds the design prompt

4. **Workflow Step 2** (`step.runAction` — `daytona.setupAndExecuteDesign`) →
   - Creates or reuses a Daytona sandbox
   - Uploads the prompt file + handler script to the sandbox
   - Runs `nohup node /tmp/run-design.mjs &` — **returns immediately**
   - Action completes, returns `sandboxId`

5. **Workflow Step 3** (`step.awaitEvent("designComplete")`) → workflow pauses, waiting for an event

6. **Inside Daytona sandbox** (running independently, no Convex action active):
   - Handler script spawns Claude CLI with `--output-format stream-json`
   - Every 500ms, streams activity updates to Convex via `fetch()` → `POST /api/mutation` → `streaming:set`
   - When Claude CLI finishes, calls `fetch()` → `POST /api/mutation` → `designWorkflow:handleCompletion`

7. **Convex mutation** (`designWorkflow.handleCompletion`) → authenticates via Clerk JWT, calls `workflow.sendEvent("designComplete")` with the result

8. **Workflow resumes** from step 3 → Step 4 (`step.runMutation` — `designWorkflow.saveResult`) → parses JSON, saves variations to the session, clears streaming activity

## Key Insight

Between steps 4 and 7, **no Convex compute is running**. The workflow is just parked waiting for an event. All the heavy work (Claude CLI, ~2-5 min) happens inside Daytona with zero Convex resources consumed.

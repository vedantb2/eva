# fn-5.8 Build NewFeatureModal with AI spec generation

## Description

Create the "New feature" flow for AI-powered spec generation:

1. **NewFeatureButton**: Button in repo board header that opens modal
2. **NewFeatureModal**: `web/lib/components/features/NewFeatureModal.tsx`
   - Step 1: Textarea for brief feature description
   - Step 2: Loading state while AI generates spec
   - Step 3: Display generated spec (title, description, subtasks)
   - Step 4: Confirm to create task with subtasks

3. **AI Action**: `backend/convex/specs.ts`
   - `generateSpec` action that calls AI API
   - Returns structured spec: { title, description, subtasks[] }
   - Use environment variable for API key

4. **Integration**: Wire modal to create task + subtasks on confirm

## Files to Create/Modify
- `web/lib/components/features/NewFeatureModal.tsx` (new)
- `web/lib/components/features/NewFeatureButton.tsx` (new)
- `backend/convex/specs.ts` (new)

## Acceptance
- [ ] "New feature" button visible on repo board page
- [ ] Modal opens with textarea for feature description
- [ ] Submit triggers AI spec generation with loading state
- [ ] Generated spec displays title, description, subtasks
- [ ] Confirm creates task with subtasks on the board
- [ ] Error state shown if AI call fails
- [ ] No TypeScript errors

## Done summary
- Created specs.ts action with OpenAI API integration
- Fallback to mock spec generation if no API key
- Created NewFeatureModal with input/generating/review/error steps
- Created NewFeatureButton wrapper component
- Added button to repo board page header
- Updated api.ts with specs action type

Why:
- Enable AI-powered feature spec generation from brief descriptions
- Automatically create tasks with subtasks from generated specs

Verification:
- npx convex dev --once passes
- npx tsc --noEmit passes
## Evidence
- Commits: d9d7bd2237b68623a3e5064efc47001261e6db4a
- Tests: npx convex dev --once, npx tsc --noEmit
- PRs:
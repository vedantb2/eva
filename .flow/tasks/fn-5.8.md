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
TBD

## Evidence
- Commits:
- Tests:
- PRs:

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

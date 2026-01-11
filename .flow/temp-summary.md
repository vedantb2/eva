- Created `projects.ts` with list, get, create, update, remove functions
- Created `tasks.ts` with listByProject, get, create, update, updateStatus, updateOrder, remove functions
- All mutations validate user ownership via Clerk identity.subject

Why:
- Provides API layer for frontend to interact with Convex database
- Follows existing auth patterns from auth.ts

Verification:
- `npx convex codegen` passed without errors

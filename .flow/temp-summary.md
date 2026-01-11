- Created githubRepos.ts with list, get, getByOwnerAndName, create, remove functions
- All functions require authentication
- Create mutation checks for duplicate repos before insert
- Using index by_owner_name for efficient lookup

Why:
- Enable CRUD operations for GitHub repository management
- Support repo-to-board relationship in Repositories page

Verification:
- npx convex dev --once passes without errors

# fn-6.9 Create [repo] dynamic route folder structure under (main)

## Description

Create the [repo] dynamic route folder structure under (main).

### Folder Structure
```
web/app/(main)/[repo]/
├── layout.tsx        # RepoLayout wrapper
├── plan/
│   └── page.tsx      # Plan page
├── features/
│   ├── page.tsx      # Features list
│   └── [featureId]/
│       └── page.tsx  # Feature detail with Kanban
└── quick-tasks/
    └── page.tsx      # Quick tasks Kanban
```

### Key Points
- `[repo]` param format: `owner-reponame` (hyphen-joined)
- layout.tsx provides repo context to all child routes
- Each page.tsx can be a placeholder initially

### Files to Create
- `web/app/(main)/[repo]/layout.tsx`
- `web/app/(main)/[repo]/plan/page.tsx` (placeholder)
- `web/app/(main)/[repo]/features/page.tsx` (placeholder)
- `web/app/(main)/[repo]/features/[featureId]/page.tsx` (placeholder)
- `web/app/(main)/[repo]/quick-tasks/page.tsx` (placeholder)
## Acceptance
- [ ] TBD

## Done summary
- Created [repo] dynamic route folder under (main)
- Added RepoLayout wrapper (placeholder for now)
- Created placeholder pages for plan, features, features/[featureId], quick-tasks
- All pages have basic placeholder content
## Evidence
- Commits: 658660a
- Tests:
- PRs:
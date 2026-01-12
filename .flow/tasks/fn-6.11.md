# fn-6.11 Create RepoSwitcher dropdown component using HeroUI

## Description

Create the RepoSwitcher dropdown component using HeroUI.

### Implementation

```typescript
// web/lib/components/RepoSwitcher.tsx
export function RepoSwitcher() {
  const repos = useQuery(api.githubRepos.list);
  const currentRepo = useRepoContext();
  const router = useRouter();
  
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="bordered">
          {currentRepo?.fullName || "Select Repository"}
          <ChevronDownIcon />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        onAction={(key) => {
          router.push(`/${encodeRepoSlug(key)}/features`);
        }}
      >
        {repos?.map((repo) => (
          <DropdownItem key={repo.fullName}>
            {repo.fullName}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
```

### Key Points
- Use HeroUI Dropdown component
- Show current repo name in trigger
- Navigate to /[repo]/features on selection
- Use `encodeRepoSlug` to format URL

### Files to Create
- `web/lib/components/RepoSwitcher.tsx`
## Acceptance
- [ ] TBD

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

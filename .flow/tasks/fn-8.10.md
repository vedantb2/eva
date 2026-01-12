# fn-8.10: Run TypeScript check and test all refactored pages

## Goal
Verify all refactored pages work correctly and TypeScript compiles without errors.

## Checklist

### TypeScript
- [ ] Run `npx tsc --noEmit` in web directory
- [ ] Fix any type errors

### Manual Testing
- [ ] Landing page - auth buttons work, sign in/up modals open
- [ ] Repos page - list loads, sync works, add repos works
- [ ] Repos setup page - auto-sync works, add buttons work
- [ ] Features page - list loads, links work
- [ ] Quick tasks page - list loads, create modal works
- [ ] Plan page - list loads, new plan button works
- [ ] Plan detail page - conversation works, finalization works
- [ ] Feature detail page - details load, tasks display

### Verification
- [ ] Count pages with "use client" - should only be in *Client.tsx files
- [ ] Verify page.tsx files are server components

## Commands
```bash
cd web

# TypeScript check
npx tsc --noEmit

# Find all "use client" in app directory
grep -r "use client" app/

# Should only see *Client.tsx files, not page.tsx
```

## Acceptance Criteria
- [ ] TypeScript compiles without errors
- [ ] All pages render correctly
- [ ] All interactive features work
- [ ] Only *Client.tsx files have "use client"

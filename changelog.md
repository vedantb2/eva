# Changelog

## Replace hardcoded teal colors with primary theme variables - 2026-02-06

- Replaced all hardcoded `teal-*` Tailwind color classes across 29 files with `primary` theme equivalents (`text-primary`, `bg-primary/10`, `border-primary`, etc.)
- Collapsed redundant `dark:` variant classes since `primary` CSS variables already adapt to dark mode
- Updated gradient backgrounds (sidebar logo, welcome banner, repo home) to use `bg-primary/10` and `bg-gradient-to-br from-primary/80 to-primary/90`
- Replaced teal spinner borders, selection rings, chat bubbles, and status indicators with primary color
- Updated `UserInitials` to use `bg-primary text-primary-foreground`
- Updated `ProjectPhaseBadge` finalized phase to use `bg-primary/15` and `text-primary`

## Replace HeroUI with shadcn/ui - 2026-02-06

- Migrated all 57 files from HeroUI components to shadcn/ui equivalents
- Created 15 shadcn UI components (button, dialog, input, textarea, card, tabs, accordion, tooltip, popover, dropdown-menu, select, checkbox, avatar, badge, progress, separator, label, spinner)
- Added CSS variable theming in globals.css preserving teal primary color scheme
- Updated tailwind.config.js to remove HeroUI plugin and add shadcn color config
- Replaced HeroUIProvider with TooltipProvider in ClientProvider.tsx
- Created useDisclosure hook replacement at lib/hooks/use-disclosure.ts
- Replaced all HeroUI-specific Tailwind classes (text-default-*, bg-default-*, border-divider) with shadcn equivalents
- Added components.json for shadcn CLI configuration
- Installed Radix UI primitives and class-variance-authority dependencies

# Vense CRM Development Rules

## Coding Standards

1. Use British English spelling throughout the codebase (e.g., 'organisation' not 'organization').
2. Follow PascalCase for component names and camelCase for functions and variables.
3. Use server components by default, only use client components when interactivity is required.
4. Place client components in separate files with PascalCase naming.
5. Minimise the number of client components to improve performance.
6. Place related components in the same parent folders as the current file.
7. Follow DRY (Don't Repeat Yourself) principles.
8. Balance simplicity with maintainability.
9. Follow clean code principles.
10. Only add comments when necessary for complex logic.

## UI/UX Guidelines

1. Maintain the glassmorphic design throughout the application.
2. For text, only capitalise the first word of a sentence or phrase, keep all other words in lowercase.
3. Ensure all UI elements are accessible.
4. Maintain responsive design for all screen sizes.
5. Use consistent spacing and layout throughout the application.
6. Follow the established colour scheme and design language.

## Component Structure

1. Use the Shadcn UI component library for consistent UI elements.
2. Create reusable components for common patterns.
3. Keep components focused on a single responsibility.
4. Use TypeScript interfaces for component props.
5. Ensure proper type safety throughout the codebase.

## State Management

1. Use React hooks for local state management.
2. Keep state as close to where it's used as possible.
3. Use context sparingly and only when state needs to be shared across multiple components.

## Performance Considerations

1. Use server components for static content.
2. Optimise images and assets.
3. Implement proper loading states.
4. Consider code splitting for large components.
5. Minimise client-side JavaScript.

## Documentation

1. Maintain the `ai-guidance` folder with up-to-date documentation.
2. Update `project-structure.md` when adding new features or changing the structure.
3. Use `rules.md` as the source of truth for development standards.
4. Create and maintain `features.md` as a to-do list for tracking feature implementation.

## Development Workflow

1. For complex changes, present a detailed plan for approval before implementation.
2. For simple changes, proceed thoughtfully step-by-step.
3. When debugging, hypothesise multiple possible sources, narrow to the most likely, and test or implement solutions confidently.
4. Always ask questions before implementing if there are any doubts.
5. Reflect on different possible sources of problems, distill those down to the most likely sources, and add logs to validate assumptions before implementing code fixes. 
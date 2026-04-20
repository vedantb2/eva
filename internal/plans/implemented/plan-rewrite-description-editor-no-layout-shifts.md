# Plan: Rewrite Description Editor (No Layout Shifts)

## Context

The current description input uses **Streamdown for view mode** and **TipTap for edit mode**, causing layout shifts and styling inconsistencies. The fix is to use **TipTap for both modes** with `editable` toggled.

## Solution

Replace dual-rendering approach with a single TipTap editor that toggles between editable/readonly states.

## Files to Modify

### 1. Rewrite `FormattedText.tsx` → `MarkdownEditor.tsx`

**Path:** `apps/web/src/lib/components/tasks/_components/FormattedText.tsx`

Key changes:

- Apply prose styling via `editorProps.attributes.class` (not wrapper className)
- Add `placeholder` prop with CSS pseudo-element
- Keep `contentType: "markdown"` and `gfm: true`
- Expose `getMarkdown()` and `focus()` via ref

```typescript
const editor = useEditor({
  extensions: EXTENSIONS,
  content,
  contentType: "markdown",
  editable,
  immediatelyRender: false,
  editorProps: {
    attributes: {
      class: cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "outline-none",
        "[&_p]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
      ),
    },
  },
  onBlur: ({ editor: e }) => onBlur?.(e.getMarkdown()),
});
```

### 2. Simplify `TaskDescription.tsx`

**Path:** `apps/web/src/lib/components/tasks/_components/TaskDescription.tsx`

Changes:

- Remove `Streamdown` import and usage
- Remove lazy loading of FormattedText
- Use single `MarkdownEditor` component for both view/edit
- Toggle `editable` prop based on `isEditingDescription` state

Before:

```tsx
{isEditingDescription ? (
  <FormattedText ... />  // TipTap
) : (
  <Streamdown ... />     // Different renderer = layout shift
)}
```

After:

```tsx
<MarkdownEditor
  content={mainDesc}
  editable={isEditingDescription}
  placeholder="Click to add description..."
  onBlur={handleSave}
/>
```

### 3. Update `QuickTaskModal.tsx`

**Path:** `apps/web/src/lib/components/quick-tasks/QuickTaskModal.tsx`

Minimal changes:

- Update import to use renamed component
- Use `placeholder` prop instead of CSS content hack

## Implementation Steps

1. **Rewrite FormattedText.tsx:**
   - Rename to MarkdownEditor (or keep name, just rewrite internals)
   - Move prose styling to `editorProps.attributes.class`
   - Add `placeholder` prop
   - Ensure `setContent` uses `{ contentType: "markdown" }`

2. **Simplify TaskDescription.tsx:**
   - Remove Streamdown imports
   - Remove lazy loading
   - Use MarkdownEditor with `editable` toggle
   - Keep element details accordion logic unchanged

3. **Update QuickTaskModal.tsx:**
   - Update to use new placeholder prop
   - Keep existing ref usage for `getMarkdown()`

## Verification

1. Go to quick task detail page, click description:
   - Should enter edit mode with no layout shift
   - Click outside should save and show view mode identically

2. Open quick task modal:
   - Should show placeholder when empty
   - Should preserve markdown formatting on blur

3. Test markdown features:
   - Bold, italic, lists, headings should render correctly
   - Formatting should survive edit → blur → re-edit cycle

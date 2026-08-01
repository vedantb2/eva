# Bugbot rules

## Double borders on elevated surfaces

Flag any elevated surface (card, dialog, modal, popover, dropdown, menu,
tooltip, sheet, toast) that puts a `border-*` or `ring-*` utility and a
`shadow-*` utility on the **same element**. This renders a double-border
artifact: the border paints a hard 1px stroke and the shadow's outer edge sits
just beside it, so the edge reads as two stacked lines.

**Fix:** replace the border/ring + shadow pair with a single
`smooth-shadow-ring-{size}` utility, which bakes a 1px hairline ring into the
shadow's final layer. Do not leave a `border` or `ring` on an element that
already uses `smooth-shadow-ring-*`. The ring is already in there and a second
edge doubles up.

- Flag: `className="rounded-surface border border-border bg-card shadow-md"`
- Suggest: `className="rounded-surface bg-card smooth-shadow-ring-md"`

Sizes: `smooth-shadow-ring-xs`, `-sm`, `-md` (or bare `smooth-shadow-ring`),
`-lg`, `-xl`, `-2xl`.

**Do not flag** borders that are not edges of a floating surface: layout-region
dividers (sidebar edge, list/detail split, table and menu separators, header
`border-b`), form affordances (input, select, textarea, `InputGroup`), accent
bars (`border-l` status stripes), or `focus-visible:ring-*`, which is a state
rather than an edge and composes freely with `smooth-shadow-ring-*`.

## Mixing shadow utilities

Flag any element carrying both a `shadow-*` and a `smooth-shadow-*` class. The
v3 port deliberately omits `!important`, and `tailwind-merge` does not know the
two conflict, so `cn()` will not dedupe them — whichever rule sits later in the
stylesheet wins, regardless of class order in the string. Keep one or the other.

Rules adapted from [flornkm/shadow-plugin](https://github.com/flornkm/shadow-plugin) (MIT).
See `.claude/skills/smooth-shadow-ring/SKILL.md` for the full guidance and the
eva-specific notes.

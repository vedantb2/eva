# Eva settings + stats

Direction: canvas caption, card is only the controls. Calm, technical, tone not shadow.

Depth: surface color shifts (`bg-background` → `bg-card` → `bg-muted`). No decorative hairlines on cards. List rows use a quiet `divide-border/50`. Footers are `bg-muted`, not `border-t`.

Spacing: 8px base. Caption-to-card `gap-2`. Section-to-section `space-y-8`. Page title is flush with the card edge; comfortable pages use `py-6` around the title so it isn’t toolbar-tight above or below. Section captions use `px-4` so they line up with field text inside the card.

## Caption / card

- Title: `text-balance text-sm font-semibold text-foreground`
- Description: `text-sm text-pretty text-muted-foreground` (one step above field help)
- Card: `rounded-surface bg-card`. List variant `overflow-hidden` so row hovers clip to the radius.
- Same caption indent (`px-4`) on home codebase group titles so they line up with card inner text.

## Inside the card

- Field label: `text-sm font-medium text-foreground`
- Field help / row description: `text-xs text-muted-foreground`
- Inputs, textareas, and select/combobox triggers: `bg-muted` (inset on the card)
- Preference rows: `SettingsToggleRow` as direct children of `bodyVariant="list"` so the section owns dividers

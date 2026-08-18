/**
 * Shell shared by the three doc side panels — comments, suggestions, history.
 *
 * At `md`+ it is a 320px column beside the editor, as before. Below `md` it is a
 * full-width overlay over the editor instead of a sibling of it: 320px that
 * refuses to shrink left the editor about 70px wide on a 390px phone, and
 * overflowed the page horizontally at 320px. The toggles that open these panels
 * sit in the tab bar and are always visible, so that was one tap away.
 *
 * The overlay needs a positioned ancestor — `DocContentTab`'s row is `relative`
 * for exactly this. It is opaque (`bg-background`) because it covers live editor
 * content, and each panel's own close button is the way back.
 */
export const DOC_SIDE_PANEL_CLASS =
  "flex h-full min-h-0 flex-col border-border bg-background max-md:absolute max-md:inset-0 max-md:z-20 md:w-80 md:shrink-0 md:border-l";

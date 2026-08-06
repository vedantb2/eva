/** Stable Chrome-like tab-group accent for a repo id. */
export interface TabGroupColor {
  /** Line under the group — Chrome's only group fill besides the pill. */
  underline: string;
  /** Group name pill. */
  pill: string;
  /** Selected-tab stroke (left/top/right) — matches the group accent. */
  border: string;
  /**
   * Same accent as a text colour. The selected tab's flared shoulders paint
   * their stroke with a gradient, which needs the accent as `currentColor`
   * rather than as a border.
   */
  accent: string;
}

const GROUP_COLORS: TabGroupColor[] = [
  {
    underline: "bg-sky-500",
    pill: "bg-sky-500 text-white",
    border: "border-sky-500",
    accent: "text-sky-500",
  },
  {
    underline: "bg-rose-500",
    pill: "bg-rose-500 text-white",
    border: "border-rose-500",
    accent: "text-rose-500",
  },
  {
    underline: "bg-amber-500",
    pill: "bg-amber-500 text-black",
    border: "border-amber-500",
    accent: "text-amber-500",
  },
  {
    underline: "bg-emerald-500",
    pill: "bg-emerald-500 text-white",
    border: "border-emerald-500",
    accent: "text-emerald-500",
  },
  {
    underline: "bg-violet-500",
    pill: "bg-violet-500 text-white",
    border: "border-violet-500",
    accent: "text-violet-500",
  },
  {
    underline: "bg-fuchsia-500",
    pill: "bg-fuchsia-500 text-white",
    border: "border-fuchsia-500",
    accent: "text-fuchsia-500",
  },
  {
    underline: "bg-lime-500",
    pill: "bg-lime-500 text-black",
    border: "border-lime-500",
    accent: "text-lime-500",
  },
  {
    underline: "bg-orange-500",
    pill: "bg-orange-500 text-white",
    border: "border-orange-500",
    accent: "text-orange-500",
  },
];

const FALLBACK_COLOR: TabGroupColor = {
  underline: "bg-sky-500",
  pill: "bg-sky-500 text-white",
  border: "border-sky-500",
  accent: "text-sky-500",
};

export function tabGroupColorForId(id: string): TabGroupColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % GROUP_COLORS.length;
  return GROUP_COLORS[index] ?? FALLBACK_COLOR;
}

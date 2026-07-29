/** Stable Chrome-like tab-group accent for a repo id. */
export interface TabGroupColor {
  /** Soft fill behind the group label + tabs. */
  strip: string;
  /** Group name pill. */
  pill: string;
  /** Selected tab ring / accent edge. */
  accent: string;
}

const GROUP_COLORS: TabGroupColor[] = [
  {
    strip: "bg-sky-500/15",
    pill: "bg-sky-500 text-white",
    accent: "border-sky-500/50",
  },
  {
    strip: "bg-rose-500/15",
    pill: "bg-rose-500 text-white",
    accent: "border-rose-500/50",
  },
  {
    strip: "bg-amber-500/15",
    pill: "bg-amber-500 text-black",
    accent: "border-amber-500/50",
  },
  {
    strip: "bg-emerald-500/15",
    pill: "bg-emerald-500 text-white",
    accent: "border-emerald-500/50",
  },
  {
    strip: "bg-violet-500/15",
    pill: "bg-violet-500 text-white",
    accent: "border-violet-500/50",
  },
  {
    strip: "bg-fuchsia-500/15",
    pill: "bg-fuchsia-500 text-white",
    accent: "border-fuchsia-500/50",
  },
  {
    strip: "bg-cyan-500/15",
    pill: "bg-cyan-500 text-black",
    accent: "border-cyan-500/50",
  },
  {
    strip: "bg-orange-500/15",
    pill: "bg-orange-500 text-white",
    accent: "border-orange-500/50",
  },
];

export function tabGroupColorForId(id: string): TabGroupColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % GROUP_COLORS.length;
  const color = GROUP_COLORS[index];
  if (color) return color;
  return {
    strip: "bg-sky-500/15",
    pill: "bg-sky-500 text-white",
    accent: "border-sky-500/50",
  };
}

/** Stable Chrome-like tab-group accent for a repo id. */
export interface TabGroupColor {
  /** Soft tint behind the group label + tabs. */
  strip: string;
  /** Group name pill. */
  pill: string;
}

const GROUP_COLORS: TabGroupColor[] = [
  { strip: "bg-sky-500/20", pill: "bg-sky-500 text-white" },
  { strip: "bg-rose-500/20", pill: "bg-rose-500 text-white" },
  { strip: "bg-amber-500/20", pill: "bg-amber-500 text-black" },
  { strip: "bg-emerald-500/20", pill: "bg-emerald-500 text-white" },
  { strip: "bg-violet-500/20", pill: "bg-violet-500 text-white" },
  { strip: "bg-fuchsia-500/20", pill: "bg-fuchsia-500 text-white" },
  { strip: "bg-cyan-500/20", pill: "bg-cyan-500 text-black" },
  { strip: "bg-orange-500/20", pill: "bg-orange-500 text-white" },
];

const FALLBACK_COLOR: TabGroupColor = {
  strip: "bg-sky-500/20",
  pill: "bg-sky-500 text-white",
};

export function tabGroupColorForId(id: string): TabGroupColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % GROUP_COLORS.length;
  return GROUP_COLORS[index] ?? FALLBACK_COLOR;
}

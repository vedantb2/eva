/** Stable Chrome-like tab-group accent for a repo id. */
export interface TabGroupColor {
  /** Line under the group — Chrome's only group fill besides the pill. */
  underline: string;
  /** Group name pill. */
  pill: string;
}

const GROUP_COLORS: TabGroupColor[] = [
  { underline: "bg-sky-500", pill: "bg-sky-500 text-white" },
  { underline: "bg-rose-500", pill: "bg-rose-500 text-white" },
  { underline: "bg-amber-500", pill: "bg-amber-500 text-black" },
  { underline: "bg-emerald-500", pill: "bg-emerald-500 text-white" },
  { underline: "bg-violet-500", pill: "bg-violet-500 text-white" },
  { underline: "bg-fuchsia-500", pill: "bg-fuchsia-500 text-white" },
  { underline: "bg-cyan-500", pill: "bg-cyan-500 text-black" },
  { underline: "bg-orange-500", pill: "bg-orange-500 text-white" },
];

const FALLBACK_COLOR: TabGroupColor = {
  underline: "bg-sky-500",
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

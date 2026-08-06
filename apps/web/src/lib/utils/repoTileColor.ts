const TILE_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-lime-500",
  "bg-indigo-500",
  "bg-orange-500",
];

/**
 * Deterministic tile colour so logo-less repos stay visually distinguishable.
 * Seed with `${owner}/${name}/${repoDisplayLabel(row)}` so every surface that
 * renders a repo's initial tile (rail, composer switcher) picks the same colour.
 */
export function repoTileColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % TILE_PALETTE.length;
  }
  return TILE_PALETTE[hash];
}

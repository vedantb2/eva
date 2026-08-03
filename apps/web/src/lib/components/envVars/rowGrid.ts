/**
 * Column geometry for the free-form env var list.
 *
 * The header strip, the data rows, and the add row all spread this same class so
 * the three columns line up without a `<table>` — the old markup paid for
 * alignment with per-cell padding on every `TableCell`, which is what made it
 * drift. Keep it here: changing a column width moves all three in step.
 */
export const ENV_VAR_ROW_GRID =
  "grid grid-cols-[minmax(5rem,1fr)_minmax(0,1.6fr)_auto] items-center gap-3 px-4";

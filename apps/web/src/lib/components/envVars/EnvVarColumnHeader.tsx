import { cn } from "@eva/ui";
import { ENV_VAR_ROW_GRID } from "./rowGrid";

/** Named columns above the env var rows, as a quiet micro-label strip. */
export function EnvVarColumnHeader() {
  return (
    <div
      className={cn(
        ENV_VAR_ROW_GRID,
        "border-b border-border py-2 text-2xs font-medium text-muted-foreground",
      )}
    >
      <span>Key</span>
      <span>Value</span>
      <span className="text-right">Actions</span>
    </div>
  );
}

import { IconExternalLink } from "@tabler/icons-react";
import { checkTone, ToneIcon, type PrCheck } from "./prOverviewMeta";

/**
 * One check run or commit status. Review bots report through either API and
 * GitHub's own page merges the two, so both render identically here.
 *
 * Shared by the Checks tab and the collapsed list beside the merge control, so a
 * check's tone, wording, and link target cannot differ between the two places a
 * reader might meet it.
 */
export function PrCheckRow({ check }: { check: PrCheck }) {
  const row = (
    <span className="flex min-w-0 items-center gap-2">
      <ToneIcon tone={checkTone(check)} />
      <span className="min-w-0 flex-1 truncate text-sm">{check.name}</span>
      {check.description ? (
        <span className="hidden min-w-0 max-w-[45%] truncate text-xs text-muted-foreground sm:block">
          {check.description}
        </span>
      ) : null}
      {check.htmlUrl ? (
        <IconExternalLink
          size={12}
          className="shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </span>
  );

  if (check.htmlUrl === null) {
    return <div className="px-1.5 py-1">{row}</div>;
  }
  return (
    <a
      href={check.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md px-1.5 py-1 hover:bg-muted/50"
    >
      {row}
    </a>
  );
}

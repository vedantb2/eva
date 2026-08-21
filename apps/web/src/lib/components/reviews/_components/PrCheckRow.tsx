import { IconExternalLink } from "@tabler/icons-react";
import { checkTone, ToneIcon, type PrCheck } from "./prOverviewMeta";

/**
 * One check run or commit status. Review bots report through either API and
 * GitHub's own page merges the two, so both render identically here.
 *
 * Its own component rather than inlined in `PrChecksPanel`: the tone mapping, the
 * bot summary line and the link-or-not branch are the whole substance of a check
 * row, and the panel around it is a heading and a list.
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

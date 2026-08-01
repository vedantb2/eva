import { Streamdown } from "streamdown";
import { OverviewCard } from "./OverviewCard";
import { MARKDOWN_CLASS } from "./prOverviewMeta";

export function PrDescriptionCard({ body }: { body: string | null }) {
  return (
    <OverviewCard title="Description">
      {body ? (
        <Streamdown className={MARKDOWN_CLASS}>{body}</Streamdown>
      ) : (
        <p className="text-sm text-muted-foreground">
          No description was written for this pull request.
        </p>
      )}
    </OverviewCard>
  );
}

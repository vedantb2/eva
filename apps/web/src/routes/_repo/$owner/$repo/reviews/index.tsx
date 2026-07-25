import { createFileRoute } from "@tanstack/react-router";
import { IconGitPullRequest } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";

export const Route = createFileRoute("/_repo/$owner/$repo/reviews/")({
  component: ReviewsIndexPage,
});

function ReviewsIndexPage() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <EmptyState
        icon={
          <IconGitPullRequest size={24} className="text-muted-foreground" />
        }
        title="Select a pull request to review"
      />
    </div>
  );
}

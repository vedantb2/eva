import { createFileRoute, redirect } from "@tanstack/react-router";
import { REVIEW_DEFAULT_TAB, isReviewTab } from "@/lib/search-params";
import { ReviewDetailClient } from "@/lib/components/reviews/ReviewDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/reviews/$prNumber/$reviewTab",
)({
  beforeLoad: ({ params }) => {
    if (!isReviewTab(params.reviewTab)) {
      throw redirect({
        to: "/$owner/$repo/reviews/$prNumber/$reviewTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          prNumber: params.prNumber,
          reviewTab: REVIEW_DEFAULT_TAB,
        },
        search: (prev) => prev,
      });
    }
  },
  component: ReviewDetailTabPage,
});

function ReviewDetailTabPage() {
  const { prNumber, reviewTab } = Route.useParams();
  return (
    <ReviewDetailClient prNumberParam={prNumber} reviewTabParam={reviewTab} />
  );
}

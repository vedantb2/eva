import { createFileRoute, redirect } from "@tanstack/react-router";
import { REVIEW_DEFAULT_TAB, canonicalReviewTab } from "@/lib/search-params";
import { ReviewDetailClient } from "@/lib/components/reviews/ReviewDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/reviews/$prNumber/$reviewTab",
)({
  beforeLoad: ({ params }) => {
    // Unknown slugs fall back to the default tab; the old `diff` slug maps onto
    // the canonical `diffs` the sandbox already used.
    const canonical = canonicalReviewTab(params.reviewTab);
    if (canonical !== params.reviewTab) {
      throw redirect({
        to: "/$owner/$repo/reviews/$prNumber/$reviewTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          prNumber: params.prNumber,
          reviewTab: canonical ?? REVIEW_DEFAULT_TAB,
        },
        search: (prev) => prev,
        replace: true,
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

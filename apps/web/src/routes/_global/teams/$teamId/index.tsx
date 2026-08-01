import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_global/teams/$teamId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/teams/$teamId/$teamTab",
      params: {
        teamId: params.teamId,
        teamTab: "activity",
      },
    });
  },
});

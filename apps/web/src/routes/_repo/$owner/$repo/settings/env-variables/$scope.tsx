import { createFileRoute, redirect } from "@tanstack/react-router";
import { EnvVariablesPageClient } from "../EnvVariablesPageClient";
import { isEnvVarScope } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/env-variables/$scope",
)({
  beforeLoad: ({ params }) => {
    if (!isEnvVarScope(params.scope)) {
      throw redirect({
        to: "/$owner/$repo/settings/env-variables/$scope",
        params: {
          owner: params.owner,
          repo: params.repo,
          scope: "repo",
        },
      });
    }
  },
  component: EnvVariablesScopeRoute,
});

function EnvVariablesScopeRoute() {
  const { scope } = Route.useParams();
  if (!isEnvVarScope(scope)) {
    return null;
  }
  return <EnvVariablesPageClient scope={scope} />;
}

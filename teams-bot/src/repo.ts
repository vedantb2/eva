import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const getByOwnerAndNameNoAuth = makeFunctionReference<
  "query",
  { owner: string; name: string }
>("githubRepos:getByOwnerAndNameNoAuth");

interface RepoData {
  _id: string;
  owner: string;
  name: string;
  installationId: number;
}

function isRepoData(val: unknown): val is RepoData {
  return (
    val !== null &&
    typeof val === "object" &&
    "_id" in val &&
    typeof val._id === "string" &&
    "owner" in val &&
    typeof val.owner === "string" &&
    "name" in val &&
    typeof val.name === "string" &&
    "installationId" in val &&
    typeof val.installationId === "number"
  );
}

export async function lookupRepo(
  owner: string,
  name: string
): Promise<RepoData | null> {
  const result: unknown = await client.query(getByOwnerAndNameNoAuth, {
    owner,
    name,
  });
  if (isRepoData(result)) return result;
  return null;
}

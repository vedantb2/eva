export function repoHref(
  owner: string,
  name: string,
  rootDirectory?: string,
): string {
  if (!rootDirectory) return `/${owner}/${name}`;
  const appName = rootDirectory.split("/").pop();
  return `/${owner}/${name}/${appName}`;
}

export function decodeRepoParam(repoParam: string): {
  name: string;
  appName: string | undefined;
} {
  const parts = repoParam.split("--");
  return {
    name: parts[0],
    appName: parts.length > 1 ? parts[1] : undefined,
  };
}

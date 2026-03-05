/**
 * Undo the middleware rewrite that encodes `/{owner}/{repo}/{appName}`
 * as `/{owner}/{repo}--{appName}` so that client-side code always
 * works with the clean, user-facing URL shape.
 */
export function normalizePathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[1].includes("--")) {
    const [name, appName] = segments[1].split("--", 2);
    return "/" + [segments[0], name, appName, ...segments.slice(2)].join("/");
  }
  return pathname;
}

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

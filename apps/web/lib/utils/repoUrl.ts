export function encodeRepoSlug(
  fullName: string,
  rootDirectory?: string,
): string {
  const base = fullName.replace("/", "-");
  if (!rootDirectory) return base;
  return base + "~" + rootDirectory.replace(/\//g, "~");
}

export function decodeRepoSlug(slug: string): {
  fullName: string;
  rootDirectory: string | undefined;
} {
  const tildeIndex = slug.indexOf("~");
  const repoSlug = tildeIndex === -1 ? slug : slug.slice(0, tildeIndex);
  const rootDirectory =
    tildeIndex === -1
      ? undefined
      : slug.slice(tildeIndex + 1).replace(/~/g, "/");

  const firstHyphen = repoSlug.indexOf("-");
  const fullName =
    firstHyphen === -1
      ? repoSlug
      : repoSlug.slice(0, firstHyphen) + "/" + repoSlug.slice(firstHyphen + 1);

  return { fullName, rootDirectory: rootDirectory || undefined };
}

export function buildRepoPath(
  fullName: string,
  path: string,
  rootDirectory?: string,
): string {
  return `/${encodeRepoSlug(fullName, rootDirectory)}${path}`;
}

export function encodeRepoSlug(fullName: string): string {
  return fullName.replace("/", "-");
}

export function decodeRepoSlug(slug: string): string {
  const firstHyphen = slug.indexOf("-");
  if (firstHyphen === -1) return slug;
  return slug.slice(0, firstHyphen) + "/" + slug.slice(firstHyphen + 1);
}

export function buildRepoPath(fullName: string, path: string): string {
  return `/${encodeRepoSlug(fullName)}${path}`;
}

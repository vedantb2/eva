const DEFAULT_RESULT_LIMIT = 100;

function finalPathSegment(path: string): string {
  const separator = path.lastIndexOf("/");
  return separator < 0 ? path : path.slice(separator + 1);
}

function subsequenceScore(value: string, query: string): number | null {
  let valueIndex = 0;
  let gapPenalty = 0;
  for (let queryIndex = 0; queryIndex < query.length; queryIndex++) {
    const matchIndex = value.indexOf(query[queryIndex], valueIndex);
    if (matchIndex < 0) return null;
    gapPenalty += matchIndex - valueIndex;
    valueIndex = matchIndex + 1;
  }
  return gapPenalty;
}

function tokenScore(path: string, fileName: string, token: string): number | null {
  if (fileName === token) return 0;
  if (fileName.startsWith(token)) return 10 + fileName.length - token.length;

  const fileNameIndex = fileName.indexOf(token);
  if (fileNameIndex >= 0) return 100 + fileNameIndex;
  if (path.startsWith(token)) return 200 + path.length - token.length;

  const pathIndex = path.indexOf(token);
  if (pathIndex >= 0) return 300 + pathIndex;

  const fuzzyScore = subsequenceScore(path, token);
  return fuzzyScore === null ? null : 1000 + fuzzyScore;
}

function scorePath(path: string, tokens: string[]): number | null {
  const normalizedPath = path.toLocaleLowerCase();
  const fileName = finalPathSegment(normalizedPath);
  let total = 0;
  for (const token of tokens) {
    const score = tokenScore(normalizedPath, fileName, token);
    if (score === null) return null;
    total += score;
  }
  return total;
}

export function sandboxFileName(path: string): string {
  return finalPathSegment(path);
}

export function sandboxFileDirectory(path: string): string {
  const separator = path.lastIndexOf("/");
  return separator < 0 ? "" : path.slice(0, separator);
}

/** Ranks a bounded set so quick-open stays responsive in 20k-file repos. */
export function rankSandboxFiles(
  paths: string[],
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
): string[] {
  const tokens = query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return paths.slice(0, limit);

  const ranked: Array<{ path: string; score: number }> = [];
  for (const path of paths) {
    const score = scorePath(path, tokens);
    if (score !== null) ranked.push({ path, score });
  }
  ranked.sort((first, second) => {
    if (first.score !== second.score) return first.score - second.score;
    if (first.path.length !== second.path.length) {
      return first.path.length - second.path.length;
    }
    return first.path.localeCompare(second.path);
  });
  return ranked.slice(0, limit).map((result) => result.path);
}

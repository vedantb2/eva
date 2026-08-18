import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The preview proxy ships as a String.raw template that runs standalone inside
 * the sandbox, so nothing in it can be imported. Tests lift the exact shipped
 * source of individual functions out of the template and instantiate them, so
 * they exercise the real code rather than a copy that could drift.
 */
export const previewProxySource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../convex/_sandbox_runtime/previewProxy.ts",
  ),
  "utf8",
);

/** Slices one function out of the template by its exact signature line. */
export function extractFunctionSource(signature: string): string {
  const start = previewProxySource.indexOf(signature);
  if (start === -1) {
    throw new Error(`Could not find ${signature} in previewProxy.ts`);
  }
  let depth = 0;
  let seenBrace = false;
  for (let i = start; i < previewProxySource.length; i += 1) {
    const char = previewProxySource[i];
    if (char === "{") {
      depth += 1;
      seenBrace = true;
    } else if (char === "}") {
      depth -= 1;
      if (seenBrace && depth === 0) {
        return previewProxySource.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unbalanced braces extracting ${signature}`);
}

// Shared AST helpers for eva oxlint rules.

/** True if `node` is an Identifier (optionally with a specific `name`). */
export function isIdentifier(node, name) {
  return (
    node?.type === "Identifier" && (name === undefined || node.name === name)
  );
}

import { isIdentifier } from "../utils.mjs";

const message =
  "Do not use a bare `JSON.parse(...)` result — it is `any` and flows " +
  "unchecked. Validate at the boundary with Zod: " +
  "`schema.safeParse(JSON.parse(x))` or `schema.parse(JSON.parse(x))`. " +
  "Do not cast or annotate as `unknown` to silence this. See CLAUDE.md.";

const isJsonParse = (node) =>
  node?.type === "CallExpression" &&
  node.callee?.type === "MemberExpression" &&
  isIdentifier(node.callee.object, "JSON") &&
  isIdentifier(node.callee.property, "parse");

/**
 * Flags bare `JSON.parse` unless it is the direct argument to a Zod
 * `.safeParse` / `.parse` call. Eva does not treat `: unknown` / `as unknown`
 * as an escape hatch — parse at the boundary.
 */
export default {
  meta: {
    type: "problem",
    docs: { description: message },
  },
  create(context) {
    // JSON.parse nodes that sit in a disciplined position. Enclosing nodes are
    // visited before the inner JSON.parse (top-down), so this is populated in
    // time for the check below.
    const allowed = new Set();
    const allow = (node) => {
      if (isJsonParse(node)) allowed.add(node);
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        // `schema.safeParse(JSON.parse(...))` / `schema.parse(JSON.parse(...))`
        if (
          callee?.type === "MemberExpression" &&
          !isIdentifier(callee.object, "JSON") &&
          (isIdentifier(callee.property, "safeParse") ||
            isIdentifier(callee.property, "parse"))
        ) {
          for (const arg of node.arguments ?? []) allow(arg);
        }

        if (isJsonParse(node) && !allowed.has(node)) {
          context.report({ node, message });
        }
      },
    };
  },
};

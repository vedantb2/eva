const message =
  "Avoid double casts (`x as A as B`, `x as unknown as T`). They silence the type " +
  "checker instead of proving the type. Validate at the boundary with a Zod schema, " +
  "or fix the source type so a single (or no) cast suffices. See CLAUDE.md.";

/**
 * Flags nested `TSAsExpression` (`x as A as B`). Complements
 * `typescript/consistent-type-assertions: never` with a clearer boundary-parse
 * message when double casts slip through.
 */
export default {
  meta: {
    type: "problem",
    docs: { description: message },
  },
  create(context) {
    return {
      TSAsExpression(node) {
        if (node.expression?.type === "TSAsExpression") {
          context.report({ node, message });
        }
      },
    };
  },
};

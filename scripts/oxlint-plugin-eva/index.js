/**
 * Message shown when the banned `isRecord` identifier is found anywhere. It is
 * deliberately written as an instruction to whoever (human or agent) is editing
 * the code: the generic `unknown`-narrowing guard is a symptom, not the fix.
 *
 * Kept verbatim in sync with the ESLint version of this rule in
 * `eslint.config.mjs` (`NO_IS_RECORD_MESSAGE`). ESLint still runs this rule
 * too until the eslint config is removed.
 */
const NO_IS_RECORD_MESSAGE =
  "BANNED: `isRecord`. If you are writing or using `isRecord`, an `unknown` has " +
  "leaked somewhere it should never reach — that `unknown` is the actual bug. " +
  "Fix it FIRST: type the data at its entry point. Parse external JSON (API " +
  "responses, webhooks, LLM output, storage) with a Zod schema via " +
  "`schema.safeParse` so only typed data flows past the boundary. Do NOT rename " +
  'this function, inline the `typeof x === "object"` check, or use `as` to ' +
  "silence this rule — remove the `unknown` at its source. See CLAUDE.md.";

/**
 * `no-is-record` flags every identifier named `isRecord` — declaration,
 * import, export, or call site — so any reintroduction of the guard (or an
 * import of it) is caught, not just the definition.
 */
const noIsRecord = {
  create(context) {
    return {
      Identifier(node) {
        if (node.name === "isRecord") {
          context.report({ message: NO_IS_RECORD_MESSAGE, node });
        }
      },
    };
  },
};

/** @type {{ meta: { name: string }, rules: Record<string, unknown> }} */
const plugin = {
  meta: {
    name: "eva",
  },
  rules: {
    "no-is-record": noIsRecord,
  },
};

export default plugin;

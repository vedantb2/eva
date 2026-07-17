import tseslint from "typescript-eslint";

/**
 * Message shown when the banned `isRecord` identifier is found anywhere. It is
 * deliberately written as an instruction to whoever (human or agent) is editing
 * the code: the generic `unknown`-narrowing guard is a symptom, not the fix.
 */
const NO_IS_RECORD_MESSAGE =
  "BANNED: `isRecord`. If you are writing or using `isRecord`, an `unknown` has " +
  "leaked somewhere it should never reach — that `unknown` is the actual bug. " +
  "Fix it FIRST: type the data at its entry point. Parse external JSON (API " +
  "responses, webhooks, LLM output, storage) with a Zod schema via " +
  "`schema.safeParse` so only typed data flows past the boundary. Do NOT rename " +
  "this function, inline the `typeof x === \"object\"` check, or use `as` to " +
  "silence this rule — remove the `unknown` at its source. See CLAUDE.md.";

/**
 * Local single-purpose plugin. `no-is-record` flags every identifier named
 * `isRecord` — declaration, import, export, or call site — so any reintroduction
 * of the guard (or an import of it) is caught, not just the definition.
 */
const evaPlugin = {
  rules: {
    "no-is-record": {
      meta: {
        type: "problem",
        docs: { description: "Ban the generic `isRecord(value: unknown)` guard." },
        schema: [],
        messages: { banned: NO_IS_RECORD_MESSAGE },
      },
      create(context) {
        return {
          Identifier(node) {
            if (node.name === "isRecord") {
              context.report({ node, messageId: "banned" });
            }
          },
        };
      },
    },
  },
};

// This config enforces only `eva/no-is-record`, but the codebase carries a few
// legacy `// eslint-disable-next-line react/exhaustive-deps` comments (renamed
// to oxlint's rule id — oxlint is now the linter that actually checks hook
// deps). A flat config errors on a disable directive for a rule it does not
// know, so we register that rule name as a no-op purely to keep those
// comments valid. We do NOT run the react hooks linter here — this is a
// compatibility shim, not a ruleset.
const reactCompatPlugin = {
  rules: {
    "exhaustive-deps": { meta: { schema: [] }, create: () => ({}) },
  },
};

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/_generated/**",
      "**/*.generated.ts",
      "**/routeTree.gen.ts",
      "**/*.d.ts",
      "**/.output/**",
      "**/.vite/**",
      "**/.wxt/**",
      "**/convex/_daytona/callbackScript.generated.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    // Legacy inline `eslint-disable react/exhaustive-deps` comments would
    // otherwise be flagged as unused (the rule is a no-op here); silence that.
    linterOptions: { reportUnusedDisableDirectives: "off" },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { eva: evaPlugin, react: reactCompatPlugin },
    rules: { "eva/no-is-record": "error" },
  },
);

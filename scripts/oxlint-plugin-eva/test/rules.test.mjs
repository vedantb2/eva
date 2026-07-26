import { assertInvalid, assertValid } from "./harness.mjs";

assertInvalid("no-is-record", `function isRecord(x) { return true; }\n`);

assertInvalid("no-is-record", `import { isRecord } from "./guards";\n`);

assertValid("no-is-record", `function isObject(x) { return true; }\n`);

assertInvalid("no-double-cast", `const x = value as unknown as string;\n`);

assertValid("no-double-cast", `const x = value as string;\n`);

assertInvalid("no-json-parse", `const data = JSON.parse(raw);\n`);

// Cast / unknown annotation is not an escape hatch in eva.
assertInvalid("no-json-parse", `const data = JSON.parse(raw) as MyType;\n`);

assertInvalid("no-json-parse", `const data: unknown = JSON.parse(raw);\n`);

assertInvalid("no-json-parse", `const data = JSON.parse(raw) as unknown;\n`);

assertValid(
  "no-json-parse",
  `const data = schema.safeParse(JSON.parse(raw));\n`,
);

assertValid("no-json-parse", `const data = schema.parse(JSON.parse(raw));\n`);

// no-value-block-in-try — React Compiler bails on the whole file for these.
// Scope below mirrors what babel-plugin-react-compiler actually rejects.

const inHook = (body) => `function useThing(a, b, fn, xs) {
${body}
}
`;

assertInvalid(
  "no-value-block-in-try",
  inHook(`try { const x = a ? 1 : 2; } catch {}`),
);

assertInvalid(
  "no-value-block-in-try",
  inHook(`try { const x = a ?? b; } catch {}`),
);

assertInvalid("no-value-block-in-try", inHook(`try { fn?.(); } catch {}`));

assertInvalid(
  "no-value-block-in-try",
  inHook(`try { for (const x of xs) fn(x); } catch {}`),
);

// `finally` bails just like `try`.
assertInvalid(
  "no-value-block-in-try",
  inHook(`try { fn(); } catch {} finally { const x = a || b; }`),
);

// Components are compiled too, including via a `memo` wrapper.
assertInvalid(
  "no-value-block-in-try",
  `const Card = memo((a) => { try { const x = a ? 1 : 2; } catch {} });
`,
);

// Statement-level control flow compiles fine.
assertValid(
  "no-value-block-in-try",
  inHook(`try { if (a) { fn(); } else { fn(); } } catch {}`),
);

// `catch` bodies are lowered separately and do not bail.
assertValid(
  "no-value-block-in-try",
  inHook(`try { fn(); } catch { const x = a ? 1 : 2; }`),
);

// Nested functions get their own lowering, so a value block inside one is fine.
assertValid(
  "no-value-block-in-try",
  inHook(`try { fn((d) => (a ? d : 0)); } catch {}`),
);

// Plain helper modules are never compiled, so nothing there can bail.
assertValid(
  "no-value-block-in-try",
  `function formatLabel(a, b) { try { return a ?? b; } catch { return ""; } }
`,
);

// Explicit opt-out disables the whole file.
assertValid(
  "no-value-block-in-try",
  `"use no memo";
function useThing(a, b) { try { const x = a ?? b; } catch {} }
`,
);

// A `finally` clause bails whatever it contains, as does a catch-less `try`.
assertInvalid(
  "no-value-block-in-try",
  inHook(`try { fn(); } catch {} finally { fn(); }`),
);

assertInvalid(
  "no-value-block-in-try",
  inHook(`try { fn(); } finally { fn(); }`),
);

assertValid("no-value-block-in-try", inHook(`try { fn(); } catch {}`));

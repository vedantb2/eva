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

const bailoutPreamble =
  "React Compiler bails on the ENTIRE FILE here, so every component in it " +
  "silently loses memoization with no build error. ";

const valueBlockMessage =
  bailoutPreamble +
  "It cannot compile expression-level control flow inside a `try` block. " +
  "Use statement-level control flow instead: `if`/`else` rather than `?:` " +
  "and `&&`/`||`/`??`, `if (fn) fn()` rather than `fn?.()`. Or move the " +
  "expression above the `try`, or into a helper function called from it. " +
  "`catch` bodies, nested functions, `if`/`else` and `switch` are all fine. " +
  "See CLAUDE.md.";

const finallyMessage =
  bailoutPreamble +
  "It cannot compile a `finally` clause at all, whatever the contents. " +
  "Duplicate the cleanup into the `catch` and after the `try`, or move the " +
  "whole `try` into a helper function. See CLAUDE.md.";

const noCatchMessage =
  bailoutPreamble +
  "It cannot compile a `try` without a `catch`. Add a `catch` clause — use " +
  "`catch { }` if there is genuinely nothing to handle. See CLAUDE.md.";

/** Value blocks: expression-level control flow the compiler cannot lower here. */
const VALUE_BLOCKS = new Set([
  "ConditionalExpression",
  "LogicalExpression",
  "ChainExpression",
]);

/** Loops bail too — their test expression is itself lowered as a value block. */
const LOOPS = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
]);

/** `&&=` / `||=` / `??=` desugar to a value block just like their operators. */
const LOGICAL_ASSIGN = new Set(["&&=", "||=", "??="]);

const FUNCTIONS = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

/** Wrappers that keep the component name on the outer binding. */
const NAME_PRESERVING_CALLS = new Set(["memo", "forwardRef", "observer"]);

/** React Compiler only lowers components (`Foo`) and hooks (`useFoo`). */
const isCompiledName = (name) =>
  typeof name === "string" && /^(use[A-Z]|[A-Z])/.test(name);

function isOffending(node) {
  if (VALUE_BLOCKS.has(node.type)) return true;
  if (LOOPS.has(node.type)) return true;
  if (node.type === "AssignmentExpression")
    return LOGICAL_ASSIGN.has(node.operator);
  // Optional chaining, when the parser emits no wrapping ChainExpression.
  if (node.type === "MemberExpression" || node.type === "CallExpression")
    return node.optional === true;
  return false;
}

/** Generic child iteration, so no per-node-type traversal table is needed. */
function* children(node) {
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value)
        if (item && typeof item.type === "string") yield item;
    } else if (value && typeof value.type === "string") {
      yield value;
    }
  }
}

/**
 * Report every value block or loop directly in a bailing block, stopping at
 * nested function boundaries — those get their own lowering and do not bail.
 */
function scanTryBlock(node, report) {
  if (!node || FUNCTIONS.has(node.type)) return;
  if (isOffending(node)) report(node, valueBlockMessage);
  for (const child of children(node)) scanTryBlock(child, report);
}

/**
 * Walk looking for `try` statements, tracking whether we are inside a function
 * React Compiler actually compiles. `compiled` latches on: everything lexically
 * within a component or hook is lowered as part of it.
 */
function walk(node, report, compiled, nameHint) {
  if (FUNCTIONS.has(node.type)) {
    const name = node.id?.name ?? nameHint;
    const inner = compiled || isCompiledName(name);
    for (const child of children(node)) walk(child, report, inner, null);
    return;
  }

  if (node.type === "TryStatement" && compiled) {
    // A finalizer or a missing catch bails on its own, whatever the contents,
    // so those are reported against the clause rather than scanned.
    if (node.finalizer) report(node.finalizer, finallyMessage);
    if (!node.handler) report(node, noCatchMessage);
    scanTryBlock(node.block, report);
    // Still descend: the catch body, and nested functions anywhere in the
    // statement, can hold their own `try` blocks.
  }

  // Carry the binding name onto the function it names, so `const Foo = () => {}`
  // and `const Foo = memo(() => {})` are both recognised as components.
  let hint = null;
  if (node.type === "VariableDeclarator") hint = node.id?.name;
  else if (node.type === "PropertyDefinition" || node.type === "Property")
    hint = node.key?.name;
  else if (
    node.type === "CallExpression" &&
    NAME_PRESERVING_CALLS.has(node.callee?.name)
  )
    hint = nameHint;

  for (const child of children(node)) walk(child, report, compiled, hint);
}

/**
 * Flags the three ways a `try` statement makes React Compiler give up: a value
 * block inside the `try`, a `finally` clause, and a missing `catch`.
 *
 * The bailout is file-scoped: one offending construct anywhere in a compiled
 * function drops memoization for every component in that file, silently and
 * with no build error. That makes it invisible without a rule like this one.
 *
 * Scope was established empirically against babel-plugin-react-compiler, then
 * checked to report zero false positives across apps/web.
 */
export default {
  meta: {
    type: "problem",
    docs: { description: valueBlockMessage },
  },
  create(context) {
    const report = (node, message) => context.report({ node, message });

    return {
      Program(program) {
        // Whole-file opt-out; nothing in the file is compiled.
        const optedOut = (program.body ?? []).some(
          (statement) =>
            statement.type === "ExpressionStatement" &&
            statement.expression?.type === "Literal" &&
            statement.expression.value === "use no memo",
        );
        if (optedOut) return;
        for (const child of children(program)) walk(child, report, false, null);
      },
    };
  },
};

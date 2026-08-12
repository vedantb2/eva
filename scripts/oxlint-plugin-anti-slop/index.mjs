// ../../scripts/oxlint-plugin-anti-slop/index.ts
import { definePlugin } from "@oxlint/plugins";

// ../../scripts/oxlint-plugin-anti-slop/rules/no-chained-type-assertions.ts
import { defineRule } from "@oxlint/plugins";
function isTypeAssertionExpression(node) {
  return node.type === "TSAsExpression" || node.type === "TSTypeAssertion";
}
function unwrapParenthesizedExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current;
}
function isConstAssertion(node) {
  const { typeAnnotation } = node;
  return typeAnnotation.type === "TSTypeReference" && typeAnnotation.typeName.type === "Identifier" && typeAnnotation.typeName.name === "const";
}
function isOutermostAssertionInChain(node) {
  let current = node;
  let parent = node.parent;
  while (parent.type === "ParenthesizedExpression" && parent.expression === current) {
    current = parent;
    parent = parent.parent;
  }
  return !isTypeAssertionExpression(parent) || parent.expression !== current;
}
function isForbiddenAssertionChain(node) {
  let assertionCount = 0;
  let hasNonConstAssertion = false;
  let current = node;
  while (isTypeAssertionExpression(current)) {
    assertionCount += 1;
    hasNonConstAssertion ||= !isConstAssertion(current);
    current = unwrapParenthesizedExpression(current.expression);
  }
  return assertionCount > 1 && hasNonConstAssertion;
}
var noChainedTypeAssertionsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains."
    },
    messages: {
      chained: "Chained type assertions discard existing type evidence and fabricate the target type without parsing. Preserve the value's original precise type, or parse genuinely unknown input at its boundary before using it."
    }
  },
  create(context) {
    const checkTypeAssertion = (node) => {
      if (!isOutermostAssertionInChain(node) || !isForbiddenAssertionChain(node)) return;
      context.report({ node, messageId: "chained" });
    };
    return {
      TSAsExpression: checkTypeAssertion,
      TSTypeAssertion: checkTypeAssertion
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-conditional-empty-object-spread.ts
import { defineRule as defineRule2 } from "@oxlint/plugins";
function unwrapParentheses(node) {
  let current = node;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current;
}
function isEmptyObjectExpression(node) {
  return node.type === "ObjectExpression" && node.properties.length === 0;
}
function singleObjectProperty(node) {
  if (node.type !== "ObjectExpression" || node.properties.length !== 1) return null;
  const [property] = node.properties;
  if (property?.type !== "Property" || property.kind !== "init" || property.method || property.computed) {
    return null;
  }
  return property;
}
function conditionalEmptyObjectSpread(node) {
  const conditional = unwrapParentheses(node);
  if (conditional.type !== "ConditionalExpression") return null;
  if (isEmptyObjectExpression(conditional.consequent)) {
    return { conditional, property: singleObjectProperty(conditional.alternate) };
  }
  if (isEmptyObjectExpression(conditional.alternate)) {
    return { conditional, property: singleObjectProperty(conditional.consequent) };
  }
  return null;
}
function undefinedCheckedExpression(test) {
  const binary = unwrapParentheses(test);
  if (binary.type !== "BinaryExpression") return null;
  if (binary.operator !== "===" && binary.operator !== "!==") return null;
  const left = unwrapParentheses(binary.left);
  const right = unwrapParentheses(binary.right);
  const leftIsUndefined = left.type === "Identifier" && left.name === "undefined";
  const rightIsUndefined = right.type === "Identifier" && right.name === "undefined";
  if (leftIsUndefined === rightIsUndefined) return null;
  return {
    expression: leftIsUndefined ? right : left,
    isDefinedWhenTrue: binary.operator === "!=="
  };
}
function canAutofixConditionalEmptyObjectSpread(sourceCode, conditional, property) {
  const checked = undefinedCheckedExpression(conditional.test);
  if (checked === null) return false;
  const propertyIsConsequent = conditional.consequent === property.parent;
  if (propertyIsConsequent !== checked.isDefinedWhenTrue) return false;
  return sourceCode.getText(unwrapParentheses(checked.expression)) === sourceCode.getText(property.value);
}
var noConditionalEmptyObjectSpreadRule = defineRule2({
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Disallow object spreads that conditionally spread an empty object to omit fields."
    },
    messages: {
      avoid: "Do not use conditional empty-object spreads. Prefer a direct property or build the object in separate statements."
    }
  },
  create(context) {
    return {
      SpreadElement(node) {
        if (node.parent.type !== "ObjectExpression") return;
        const match = conditionalEmptyObjectSpread(node.argument);
        if (match === null) return;
        const { conditional, property } = match;
        if (property !== null && canAutofixConditionalEmptyObjectSpread(context.sourceCode, conditional, property)) {
          context.report({
            node,
            messageId: "avoid",
            fix: (fixer) => fixer.replaceText(node, context.sourceCode.getText(property))
          });
          return;
        }
        context.report({ node, messageId: "avoid" });
      }
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-known-value-widening.ts
import { defineRule as defineRule3 } from "@oxlint/plugins";

// ../../scripts/oxlint-plugin-anti-slop/shared/dictionary-types.ts
var BUILT_INS = /* @__PURE__ */ new Set([
  "Record",
  "Readonly",
  "Partial",
  "Required",
  "Pick",
  "Omit",
  "PropertyKey",
  "NonNullable"
]);
var TRANSPARENT_WRAPPERS = /* @__PURE__ */ new Set(["Readonly", "Partial", "Required", "NonNullable"]);
function declaredStatement(statement) {
  return statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration" ? statement.declaration ?? null : statement;
}
function createTypeEnvironment(program) {
  const aliases = /* @__PURE__ */ new Map();
  const interfaces = /* @__PURE__ */ new Map();
  const shadowedBuiltIns = /* @__PURE__ */ new Set();
  for (const statement of program.body) {
    const declaration = declaredStatement(statement);
    if (declaration?.type === "ImportDeclaration") {
      for (const specifier of declaration.specifiers) {
        if (BUILT_INS.has(specifier.local.name)) shadowedBuiltIns.add(specifier.local.name);
      }
      continue;
    }
    if (declaration?.type === "TSTypeAliasDeclaration") {
      const existing = aliases.get(declaration.id.name);
      if (existing === void 0) aliases.set(declaration.id.name, declaration);
      else shadowedBuiltIns.add(declaration.id.name);
      if (BUILT_INS.has(declaration.id.name)) shadowedBuiltIns.add(declaration.id.name);
      continue;
    }
    if (declaration?.type === "TSInterfaceDeclaration") {
      const declarations = interfaces.get(declaration.id.name) ?? [];
      declarations.push(declaration);
      interfaces.set(declaration.id.name, declarations);
      if (BUILT_INS.has(declaration.id.name)) shadowedBuiltIns.add(declaration.id.name);
      continue;
    }
    if (declaration?.type === "TSEnumDeclaration") {
      if (BUILT_INS.has(declaration.id.name)) shadowedBuiltIns.add(declaration.id.name);
      continue;
    }
    if ((declaration?.type === "ClassDeclaration" || declaration?.type === "FunctionDeclaration") && declaration.id !== null) {
      if (BUILT_INS.has(declaration.id.name)) shadowedBuiltIns.add(declaration.id.name);
    }
  }
  return { aliases, interfaces, shadowedBuiltIns };
}
function typeReferenceName(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function isBuiltIn(name, environment) {
  return BUILT_INS.has(name) && !environment.shadowedBuiltIns.has(name);
}
function isUnappliedReferenceTo(type, name) {
  const unwrapped = unwrapTransparentType(type);
  return unwrapped.type === "TSTypeReference" && typeReferenceName(unwrapped) === name && (unwrapped.typeArguments === null || unwrapped.typeArguments === void 0 || unwrapped.typeArguments.params.length === 0);
}
function unwrapTransparentType(type) {
  let current = type;
  while (current.type === "TSParenthesizedType" || current.type === "TSTypeOperator" && current.operator === "readonly") {
    current = current.typeAnnotation;
  }
  return current;
}
function isNeverType(type) {
  return unwrapTransparentType(type).type === "TSNeverKeyword";
}
function isEffectivelyEmptyMember(member) {
  return member.type === "TSPropertySignature" && member.optional === true && member.typeAnnotation !== null && member.typeAnnotation !== void 0 && isNeverType(member.typeAnnotation.typeAnnotation);
}
function isEffectivelyEmptyTypeLiteral(type) {
  return type.members.length === 0 || type.members.every(isEffectivelyEmptyMember);
}
function isEffectivelyEmptyInterface(declarations) {
  if (declarations.length !== 1) return false;
  const [type] = declarations;
  return type !== void 0 && type.extends.length === 0 && (type.body.body.length === 0 || type.body.body.every(isEffectivelyEmptyMember));
}
function resolvedSubstitutionArgument(type, base) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type !== "TSTypeReference") return type;
  const name = typeReferenceName(unwrapped);
  if (name === null) return type;
  const substitution = base.get(name);
  return substitution === void 0 ? type : resolvedSubstitutionArgument(substitution, base);
}
function aliasSubstitution(alias, type, base) {
  const parameters = alias.typeParameters?.params ?? [];
  const arguments_ = type.typeArguments?.params ?? [];
  const next = new Map(base);
  for (const [index, parameter] of parameters.entries()) {
    const argument = arguments_[index] ?? parameter.default;
    if (argument === null || argument === void 0) return null;
    next.set(parameter.name.name, resolvedSubstitutionArgument(argument, next));
  }
  return next;
}
function unsafeDirectValue(type, environment, substitutions, resolvingAliases) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSUnknownKeyword") return "unknown";
  if (unwrapped.type === "TSAnyKeyword") return "any";
  if (unwrapped.type === "TSObjectKeyword") return "object";
  if (unwrapped.type === "TSTypeLiteral" && isEffectivelyEmptyTypeLiteral(unwrapped))
    return "empty-object";
  if (unwrapped.type === "TSUnionType") {
    return unwrapped.types.some(
      (member) => unsafeDirectValue(member, environment, substitutions, resolvingAliases) !== null
    ) ? "union" : null;
  }
  if (unwrapped.type === "TSIntersectionType") {
    const unsafeMembers = unwrapped.types.map(
      (member) => unsafeDirectValue(member, environment, substitutions, resolvingAliases)
    );
    if (unsafeMembers.includes("any")) return "any";
    return unsafeMembers.length > 0 && unsafeMembers.every((member) => member !== null) ? unsafeMembers[0] : null;
  }
  if (unwrapped.type !== "TSTypeReference") return null;
  const name = typeReferenceName(unwrapped);
  if (name === null) return null;
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? null : unsafeDirectValue(wrapped, environment, substitutions, resolvingAliases);
  }
  const substitution = substitutions.get(name);
  if (substitution !== void 0) {
    return isUnappliedReferenceTo(substitution, name) ? null : unsafeDirectValue(substitution, environment, substitutions, resolvingAliases);
  }
  const interfaceDeclarations = environment.interfaces.get(name);
  if (interfaceDeclarations !== void 0) {
    return isEffectivelyEmptyInterface(interfaceDeclarations) ? "empty-object" : null;
  }
  const alias = environment.aliases.get(name);
  if (alias === void 0 || resolvingAliases.has(name)) return null;
  const nextSubstitutions = aliasSubstitution(alias, unwrapped, substitutions);
  if (nextSubstitutions === null) return null;
  const nextResolving = new Set(resolvingAliases);
  nextResolving.add(name);
  return unsafeDirectValue(alias.typeAnnotation, environment, nextSubstitutions, nextResolving);
}
function dictionaryValueTypes(type, environment, substitutions, resolvingAliases) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.flatMap(
      (member) => member.type === "TSIndexSignature" && member.typeAnnotation !== null ? [{ type: member.typeAnnotation.typeAnnotation, substitutions }] : []
    );
  }
  if (unwrapped.type === "TSMappedType") {
    return unwrapped.typeAnnotation === null ? [] : [{ type: unwrapped.typeAnnotation, substitutions }];
  }
  if (unwrapped.type !== "TSTypeReference") return [];
  const name = typeReferenceName(unwrapped);
  if (name === null) return [];
  const substitution = substitutions.get(name);
  if (substitution !== void 0) {
    return isUnappliedReferenceTo(substitution, name) ? [] : dictionaryValueTypes(substitution, environment, substitutions, resolvingAliases);
  }
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? [] : dictionaryValueTypes(wrapped, environment, substitutions, resolvingAliases);
  }
  if (name === "Record" && isBuiltIn(name, environment)) {
    const value = unwrapped.typeArguments?.params[1] ?? null;
    return value === null ? [] : [{ type: value, substitutions }];
  }
  if ((name === "Pick" || name === "Omit") && isBuiltIn(name, environment)) {
    const source = unwrapped.typeArguments?.params[0];
    return source === void 0 ? [] : dictionaryValueTypes(source, environment, substitutions, resolvingAliases);
  }
  const alias = environment.aliases.get(name);
  if (alias === void 0 || resolvingAliases.has(name)) return [];
  const nextSubstitutions = aliasSubstitution(alias, unwrapped, substitutions);
  if (nextSubstitutions === null) return [];
  const nextResolving = new Set(resolvingAliases);
  nextResolving.add(name);
  return dictionaryValueTypes(alias.typeAnnotation, environment, nextSubstitutions, nextResolving);
}
function classifyUnsafeDictionaryValue(valueType, environment) {
  const unsafeValue = unsafeDirectValue(valueType, environment, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set());
  return unsafeValue === null ? null : { kind: "unsafe-dictionary", unsafeValue };
}
function classifyUnsafeDictionary(type, environment) {
  for (const valueType of dictionaryValueTypes(type, environment, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set())) {
    const unsafeValue = unsafeDirectValue(
      valueType.type,
      environment,
      valueType.substitutions,
      /* @__PURE__ */ new Set()
    );
    if (unsafeValue !== null) return { kind: "unsafe-dictionary", unsafeValue };
  }
  return null;
}
function resolvesToDictionary(type, environment, substitutions, resolvingAliases) {
  return dictionaryValueTypes(type, environment, substitutions, resolvingAliases).length > 0;
}
function classifyWideningTarget(type, environment) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSUnknownKeyword") return { kind: "unknown" };
  if (unwrapped.type === "TSObjectKeyword") return { kind: "object" };
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type === "TSIndexSignature") ? { kind: "open dictionary" } : unwrapped.members.length > 0 ? { kind: "anonymous object" } : null;
  }
  if (unwrapped.type === "TSMappedType") return { kind: "open dictionary" };
  if (unwrapped.type !== "TSTypeReference") return null;
  const name = typeReferenceName(unwrapped);
  if (name === null) return null;
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? null : classifyWideningTarget(wrapped, environment);
  }
  if (name === "Record" && isBuiltIn(name, environment)) return { kind: "open dictionary" };
  const alias = environment.aliases.get(name);
  if (alias === void 0) return null;
  if ((alias.typeParameters?.params.length ?? 0) > 0) {
    const substitutions2 = aliasSubstitution(alias, unwrapped, /* @__PURE__ */ new Map());
    return substitutions2 !== null && resolvesToDictionary(alias.typeAnnotation, environment, substitutions2, /* @__PURE__ */ new Set([name])) ? { kind: "generic container" } : null;
  }
  const substitutions = aliasSubstitution(alias, unwrapped, /* @__PURE__ */ new Map());
  if (substitutions === null) return null;
  const resolved = classifyAliasBroadTarget(
    alias.typeAnnotation,
    environment,
    substitutions,
    /* @__PURE__ */ new Set([name])
  );
  return resolved;
}
function classifyAliasBroadTarget(type, environment, substitutions, resolvingAliases) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSUnknownKeyword") return { kind: "unknown" };
  if (unwrapped.type === "TSObjectKeyword") return { kind: "object" };
  if (unwrapped.type !== "TSTypeReference") return null;
  const name = typeReferenceName(unwrapped);
  if (name === null) return null;
  const substitution = substitutions.get(name);
  if (substitution !== void 0) {
    return classifyAliasBroadTarget(substitution, environment, substitutions, resolvingAliases);
  }
  const alias = environment.aliases.get(name);
  if (alias === void 0 || resolvingAliases.has(name)) return null;
  const nextSubstitutions = aliasSubstitution(alias, unwrapped, substitutions);
  if (nextSubstitutions === null) return null;
  const nextResolving = new Set(resolvingAliases);
  nextResolving.add(name);
  return classifyAliasBroadTarget(
    alias.typeAnnotation,
    environment,
    nextSubstitutions,
    nextResolving
  );
}
function isKnownEvidenceExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression" || current.type === "TSAsExpression" || current.type === "TSTypeAssertion" || current.type === "TSNonNullExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  if (current.type === "ObjectExpression") return true;
  return current.type === "ArrayExpression" || current.type === "ArrowFunctionExpression" || current.type === "ClassExpression" || current.type === "FunctionExpression" || current.type === "NewExpression" || current.type === "Literal" || current.type === "TemplateLiteral" || current.type === "UnaryExpression";
}

// ../../scripts/oxlint-plugin-anti-slop/rules/no-known-value-widening.ts
function unwrapExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression" || current.type === "TSAsExpression" || current.type === "TSSatisfiesExpression" || current.type === "TSTypeAssertion" || current.type === "TSNonNullExpression") {
    current = current.expression;
  }
  return current;
}
function resolveVariable(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== void 0) return variable;
    scope = scope.upper;
  }
  return null;
}
function variableDeclarator(variable) {
  if (variable.defs.length !== 1) return null;
  const [definition] = variable.defs;
  return definition?.type === "Variable" && definition.node.type === "VariableDeclarator" ? definition.node : null;
}
function isStableConstVariable(variable, declarator) {
  return declarator.parent.type === "VariableDeclaration" && declarator.parent.kind === "const" && variable.references.every((reference) => reference.init || !reference.isWrite());
}
function hasKnownEvidence(sourceCode, expression, visitedVariables = /* @__PURE__ */ new Set()) {
  if (isKnownEvidenceExpression(expression)) return true;
  const unwrapped = unwrapExpression(expression);
  if (unwrapped.type !== "Identifier") return false;
  const variable = resolveVariable(sourceCode, unwrapped);
  if (variable === null || visitedVariables.has(variable)) return false;
  const declarator = variableDeclarator(variable);
  if (declarator === null || declarator.init === null || !isStableConstVariable(variable, declarator)) {
    return false;
  }
  visitedVariables.add(variable);
  return hasKnownEvidence(sourceCode, declarator.init, visitedVariables);
}
function annotationTarget(annotation, environment) {
  return annotation === null || annotation === void 0 ? null : classifyWideningTarget(annotation.typeAnnotation, environment);
}
function enclosingFunction(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (current.type === "ArrowFunctionExpression" || current.type === "FunctionDeclaration" || current.type === "FunctionExpression") {
      return current;
    }
    current = current.parent;
  }
  return null;
}
function sourceKeyName(sourceCode, key) {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") return key.name;
  if (key.type === "Literal") return String(key.value);
  return sourceCode.getText(key);
}
function functionName(sourceCode, owner) {
  if (owner === null) return "anonymous function";
  if (owner.id !== null) return owner.id.name;
  const parent = owner.parent;
  if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier")
    return parent.id.name;
  if (parent.type === "MethodDefinition") return sourceKeyName(sourceCode, parent.key);
  return "anonymous function";
}
function isEmptyObjectExpression2(expression) {
  const unwrapped = unwrapExpression(expression);
  return unwrapped.type === "ObjectExpression" && unwrapped.properties.length === 0;
}
function isDictionaryAccumulatorTarget(destination) {
  return destination.kind === "open dictionary" || destination.kind === "generic container";
}
function hasParentAssertion(node) {
  return node.parent?.type === "TSAsExpression" || node.parent?.type === "TSTypeAssertion";
}
var noKnownValueWideningRule = defineRule3({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence."
    },
    messages: {
      widening: "The known initializer supplying {{subject}} carries established type evidence, but the explicit {{target}} target type discards it. Preserve inference, use `satisfies`, or introduce/use a named owner contract; parse genuinely external data once at its boundary."
    }
  },
  createOnce(context) {
    let environment = null;
    const reportFlow = (expression, destination, subject, options = {}) => {
      if (destination === null) return;
      if (options.allowEmptyDictionaryAccumulator === true && isDictionaryAccumulatorTarget(destination) && isEmptyObjectExpression2(expression)) {
        return;
      }
      if (!hasKnownEvidence(context.sourceCode, expression)) return;
      context.report({
        node: expression,
        messageId: "widening",
        data: { subject, target: destination.kind }
      });
    };
    const targetFromAnnotation = (annotation) => environment === null ? null : annotationTarget(annotation, environment);
    return {
      Program(node) {
        environment = createTypeEnvironment(node);
      },
      VariableDeclarator(node) {
        if (node.init === null || node.id.type !== "Identifier") return;
        reportFlow(
          node.init,
          targetFromAnnotation(node.id.typeAnnotation),
          `binding \`${node.id.name}\``,
          { allowEmptyDictionaryAccumulator: true }
        );
      },
      PropertyDefinition(node) {
        if (node.value === null) return;
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``
        );
      },
      AccessorProperty(node) {
        if (node.value === null) return;
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``
        );
      },
      AssignmentExpression(node) {
        if (node.operator !== "=" || node.left.type !== "Identifier") return;
        const variable = resolveVariable(context.sourceCode, node.left);
        if (variable === null) return;
        const declarator = variableDeclarator(variable);
        if (declarator === null || declarator.id.type !== "Identifier") return;
        reportFlow(
          node.right,
          targetFromAnnotation(declarator.id.typeAnnotation),
          `binding \`${declarator.id.name}\``
        );
      },
      ReturnStatement(node) {
        if (node.argument === null) return;
        const owner = enclosingFunction(node);
        reportFlow(
          node.argument,
          targetFromAnnotation(owner?.returnType),
          `return value of \`${functionName(context.sourceCode, owner)}\``
        );
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === "BlockStatement") return;
        reportFlow(
          node.body,
          targetFromAnnotation(node.returnType),
          `return value of \`${functionName(context.sourceCode, node)}\``
        );
      },
      TSAsExpression(node) {
        if (environment === null || hasParentAssertion(node)) return;
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          "assertion"
        );
      },
      TSTypeAssertion(node) {
        if (environment === null || hasParentAssertion(node)) return;
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          "assertion"
        );
      }
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-object-parameters.ts
import { defineRule as defineRule4 } from "@oxlint/plugins";
function parameterAnnotation(parameter) {
  if (parameter.type === "TSParameterProperty") {
    return parameterAnnotation(parameter.parameter);
  }
  if (parameter.type === "RestElement") {
    return parameter.typeAnnotation ?? parameterAnnotation(parameter.argument);
  }
  if (parameter.type === "AssignmentPattern") {
    return parameter.typeAnnotation ?? parameter.left.typeAnnotation;
  }
  return parameter.typeAnnotation;
}
function parameterName(parameter, sourceCode) {
  return parameter.type === "Identifier" ? parameter.name : sourceCode.getText(parameter).replace(/\s*:\s*object\s*$/u, "");
}
var noObjectParametersRule = defineRule4({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary."
    },
    messages: {
      objectParameter: "Parameter `{{parameter}}` accepts the broad `object` type. Use the expected owner type or decode the external input at its boundary."
    }
  },
  create(context) {
    const aliases = /* @__PURE__ */ new Map();
    const resolvesToObject = (type, visited = /* @__PURE__ */ new Set()) => {
      if (type.type === "TSObjectKeyword") return true;
      if (type.type === "TSParenthesizedType")
        return resolvesToObject(type.typeAnnotation, visited);
      if (type.type === "TSUnionType") {
        return type.types.some((member) => resolvesToObject(member, visited));
      }
      if (type.type !== "TSTypeReference" || type.typeName.type !== "Identifier" || type.typeArguments !== null && type.typeArguments !== void 0 && type.typeArguments.params.length > 0 || visited.has(type.typeName.name)) {
        return false;
      }
      const alias = aliases.get(type.typeName.name);
      if (alias === void 0) return false;
      const nextVisited = new Set(visited);
      nextVisited.add(type.typeName.name);
      return resolvesToObject(alias, nextVisited);
    };
    const checkParameters = (node) => {
      for (const parameter of node.params) {
        const annotation = parameterAnnotation(parameter);
        if (annotation === null || annotation === void 0) continue;
        if (!resolvesToObject(annotation.typeAnnotation)) continue;
        context.report({
          node: annotation.typeAnnotation,
          messageId: "objectParameter",
          data: { parameter: parameterName(parameter, context.sourceCode) }
        });
      }
    };
    return {
      Program(node) {
        for (const statement of node.body) {
          const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
          if (declaration?.type === "TSTypeAliasDeclaration" && (declaration.typeParameters === null || declaration.typeParameters === void 0)) {
            aliases.set(declaration.id.name, declaration.typeAnnotation);
          }
        }
      },
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSConstructorType: checkParameters,
      TSDeclareFunction: checkParameters,
      TSEmptyBodyFunctionExpression: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-runtime-typeof.ts
import { defineRule as defineRule5 } from "@oxlint/plugins";
var noRuntimeTypeofRule = defineRule5({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary."
    },
    messages: {
      runtimeTypeof: "A runtime `typeof` check only narrows an unparsed representation; it does not establish the expected contract. Parse the value into a strongly typed domain type at the earliest possible point, as close as possible to the I/O boundary where the data originated."
    }
  },
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator === "typeof") {
          context.report({ node, messageId: "runtimeTypeof" });
        }
      }
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-shape-in-symbol-names.ts
import { defineRule as defineRule6 } from "@oxlint/plugins";
var FORBIDDEN_SYMBOL_NAME = "shape";
function containsForbiddenSymbolName(name) {
  return name.toLowerCase().includes(FORBIDDEN_SYMBOL_NAME);
}
var noForbiddenTermInSymbolNamesRule = defineRule6({
  meta: {
    type: "problem",
    docs: {
      description: 'Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names.'
    },
    messages: {
      forbiddenSymbolName: 'Do not use the case-insensitive substring "shape" in symbol names (found "{{name}}").'
    }
  },
  create(context) {
    const reportForbiddenSymbolName = (node) => {
      if (!containsForbiddenSymbolName(node.name)) return;
      context.report({
        node,
        messageId: "forbiddenSymbolName",
        data: { name: node.name }
      });
    };
    return {
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-unknown-parameters.ts
import { defineRule as defineRule7 } from "@oxlint/plugins";
function parameterAnnotation2(parameter) {
  if (parameter.type === "TSParameterProperty") {
    return parameterAnnotation2(parameter.parameter);
  }
  if (parameter.type === "RestElement") {
    return parameter.typeAnnotation ?? parameterAnnotation2(parameter.argument);
  }
  if (parameter.type === "AssignmentPattern") {
    return parameter.typeAnnotation ?? parameter.left.typeAnnotation;
  }
  return parameter.typeAnnotation;
}
function parameterName2(parameter, sourceText) {
  if (parameter.type === "TSParameterProperty") {
    return parameterName2(parameter.parameter, sourceText);
  }
  if (parameter.type === "AssignmentPattern") {
    return parameterName2(parameter.left, sourceText);
  }
  if (parameter.type === "RestElement") {
    return parameterName2(parameter.argument, sourceText);
  }
  return parameter.type === "Identifier" ? parameter.name : sourceText.replace(/\s*:\s*unknown\s*$/u, "");
}
var noUnknownParametersRule = defineRule7({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow explicitly unknown function parameters except `cause`; decode unknown input at its I/O boundary instead."
    },
    messages: {
      unknownParameter: "Parameter `{{parameter}}` accepts `unknown` without establishing its contract. Define the expected schema or parser so the value becomes a strongly typed domain type at the earliest possible point, as close as possible to the I/O boundary where the data originated."
    }
  },
  create(context) {
    const checkParameters = (node) => {
      for (const parameter of node.params) {
        const annotation = parameterAnnotation2(parameter);
        if (annotation?.typeAnnotation.type !== "TSUnknownKeyword") continue;
        const name = parameterName2(parameter, context.sourceCode.getText(parameter));
        if (name === "cause") continue;
        context.report({
          node: annotation.typeAnnotation,
          messageId: "unknownParameter",
          data: { parameter: name }
        });
      }
    };
    return {
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSConstructorType: checkParameters,
      TSDeclareFunction: checkParameters,
      TSEmptyBodyFunctionExpression: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-unknown-type-aliases.ts
import { defineRule as defineRule8 } from "@oxlint/plugins";
function referencedAliasName(type) {
  if (type.type === "TSParenthesizedType") return referencedAliasName(type.typeAnnotation);
  if (type.type !== "TSTypeReference" || type.typeName.type !== "Identifier") return null;
  return type.typeArguments === null || type.typeArguments === void 0 || type.typeArguments.params.length === 0 ? type.typeName.name : null;
}
var noUnknownTypeAliasesRule = defineRule8({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary."
    },
    messages: {
      unknownAlias: "Type alias `{{alias}}` only renames `unknown`. Keep `unknown` explicit on an allowed `cause` field or replace it with the parsed owner type."
    }
  },
  create(context) {
    const aliases = /* @__PURE__ */ new Map();
    const resolvesToUnknown = (type, visited = /* @__PURE__ */ new Set()) => {
      if (type.type === "TSUnknownKeyword") return true;
      if (type.type === "TSParenthesizedType")
        return resolvesToUnknown(type.typeAnnotation, visited);
      const name = referencedAliasName(type);
      if (name === null || visited.has(name)) return false;
      const alias = aliases.get(name);
      if (alias === void 0 || alias.typeParameters !== null && alias.typeParameters !== void 0) {
        return false;
      }
      const nextVisited = new Set(visited);
      nextVisited.add(name);
      return resolvesToUnknown(alias.typeAnnotation, nextVisited);
    };
    return {
      Program(node) {
        for (const statement of node.body) {
          const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
          if (declaration?.type === "TSTypeAliasDeclaration") {
            aliases.set(declaration.id.name, declaration);
          }
        }
        for (const alias of aliases.values()) {
          if (!resolvesToUnknown(alias.typeAnnotation, /* @__PURE__ */ new Set([alias.id.name]))) continue;
          context.report({
            node: alias.id,
            messageId: "unknownAlias",
            data: { alias: alias.id.name }
          });
        }
      }
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-unsafe-dictionary-type.ts
import { defineRule as defineRule9 } from "@oxlint/plugins";
function isTypeNode(node) {
  return node.type.startsWith("TS") && node.type !== "TSTypeAnnotation";
}
function typeReferenceName2(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function isInsideTypeAliasDeclaration(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (current.type === "TSTypeAliasDeclaration") return true;
    current = current.parent;
  }
  return false;
}
function isPlainAliasConsumerUse(node, environment) {
  if (node.type !== "TSTypeReference" || node.typeArguments?.params.length) return false;
  const name = typeReferenceName2(node);
  return name !== null && environment.aliases.has(name) && !isInsideTypeAliasDeclaration(node);
}
function shouldReportType(node, environment) {
  if (isPlainAliasConsumerUse(node, environment)) return false;
  if (classifyUnsafeDictionary(node, environment) === null) return false;
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (isTypeNode(current) && classifyUnsafeDictionary(current, environment) !== null)
      return false;
    current = current.parent;
  }
  return true;
}
var noUnsafeDictionaryTypeRule = defineRule9({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches."
    },
    messages: {
      unsafeDictionary: "This object dictionary's direct value type is an unsafe {{value}} escape hatch. Replace it with a concrete owner/schema-derived value type and parse external data at its boundary."
    }
  },
  createOnce(context) {
    let environment = null;
    const report = (node, value) => {
      context.report({ node, messageId: "unsafeDictionary", data: { value } });
    };
    const reportIfUnsafe = (node) => {
      if (environment === null || !shouldReportType(node, environment)) return;
      const unsafe = classifyUnsafeDictionary(node, environment);
      if (unsafe === null) return;
      report(node, unsafe.unsafeValue);
    };
    return {
      Program(node) {
        environment = createTypeEnvironment(node);
      },
      TSTypeReference: reportIfUnsafe,
      TSTypeLiteral: reportIfUnsafe,
      TSMappedType: reportIfUnsafe,
      TSIndexSignature(node) {
        if (environment === null || node.typeAnnotation === null || node.parent.type === "TSTypeLiteral")
          return;
        const unsafe = classifyUnsafeDictionaryValue(
          node.typeAnnotation.typeAnnotation,
          environment
        );
        if (unsafe !== null) report(node, unsafe.unsafeValue);
      }
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/rules/no-widen-then-assert.ts
import { defineRule as defineRule10 } from "@oxlint/plugins";
var functionBoundaryTypes = /* @__PURE__ */ new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSDeclareFunction",
  "TSEmptyBodyFunctionExpression"
]);
function unwrapExpressionParentheses(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression") current = current.expression;
  return current;
}
function unwrapTypeParentheses(type) {
  let current = type;
  while (current.type === "TSParenthesizedType") current = current.typeAnnotation;
  return current;
}
function typeReferenceName3(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function isUnknownOrAnyType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  return unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword";
}
function isBroadRecordKeyType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSStringKeyword" || unwrapped.type === "TSNumberKeyword" || unwrapped.type === "TSSymbolKeyword") {
    return true;
  }
  if (unwrapped.type === "TSUnionType") return unwrapped.types.every(isBroadRecordKeyType);
  return unwrapped.type === "TSTypeReference" && typeReferenceName3(unwrapped) === "PropertyKey";
}
function isBroadRecordType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSTypeReference") {
    if (typeReferenceName3(unwrapped) === "Readonly") {
      const [inner] = unwrapped.typeArguments?.params ?? [];
      return inner !== void 0 && isBroadRecordType(inner);
    }
    if (typeReferenceName3(unwrapped) !== "Record") return false;
    const parameters = unwrapped.typeArguments?.params ?? [];
    return parameters.length === 2 && parameters[0] !== void 0 && parameters[1] !== void 0 && isBroadRecordKeyType(parameters[0]) && isUnknownOrAnyType(parameters[1]);
  }
  if (unwrapped.type !== "TSTypeLiteral" || unwrapped.members.length !== 1) return false;
  const [member] = unwrapped.members;
  const [parameter] = member?.type === "TSIndexSignature" ? member.parameters : [];
  return member?.type === "TSIndexSignature" && member.parameters.length === 1 && parameter !== void 0 && isBroadRecordKeyType(parameter.typeAnnotation.typeAnnotation) && isUnknownOrAnyType(member.typeAnnotation.typeAnnotation);
}
function broadTypeKind(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword") return "top";
  if (unwrapped.type === "TSObjectKeyword") return "object";
  return isBroadRecordType(unwrapped) ? "record" : null;
}
function assertedExpression(node) {
  return unwrapExpressionParentheses(node.expression);
}
function assertionFromExpression(expression) {
  const unwrapped = unwrapExpressionParentheses(expression);
  return unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion" ? unwrapped : null;
}
function normalizedTypeText(sourceText, type) {
  return sourceText.slice(type.start, type.end).replaceAll(/\s+/gu, "");
}
function typesHaveSameSyntax(sourceText, left, right) {
  return left !== null && normalizedTypeText(sourceText, unwrapTypeParentheses(left)) === normalizedTypeText(sourceText, unwrapTypeParentheses(right));
}
function isDefinitelyObjectType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  switch (unwrapped.type) {
    case "TSArrayType":
    case "TSConstructorType":
    case "TSFunctionType":
    case "TSMappedType":
    case "TSObjectKeyword":
    case "TSTupleType":
      return true;
    case "TSTypeLiteral":
      return unwrapped.members.length > 0;
    case "TSIntersectionType":
      return unwrapped.types.every(isDefinitelyObjectType);
    case "TSTypeOperator":
      return unwrapped.operator === "readonly" && isDefinitelyObjectType(unwrapped.typeAnnotation);
    default:
      return false;
  }
}
function isDefinitelyNarrowerRecordType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type !== "TSIndexSignature");
  }
  if (unwrapped.type !== "TSTypeReference") return false;
  if (typeReferenceName3(unwrapped) === "Readonly") {
    const [inner] = unwrapped.typeArguments?.params ?? [];
    return inner !== void 0 && isDefinitelyNarrowerRecordType(inner);
  }
  if (typeReferenceName3(unwrapped) !== "Record") return false;
  const parameters = unwrapped.typeArguments?.params ?? [];
  return parameters.length === 2 && parameters[1] !== void 0 && !isUnknownOrAnyType(parameters[1]);
}
function functionBoundary(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (functionBoundaryTypes.has(current.type)) return current;
    current = current.parent;
  }
  return null;
}
function resolvedVariableForIdentifier(scopes, identifier) {
  for (const scope of scopes) {
    const reference = scope.references.find(
      (candidate) => candidate.identifier.start === identifier.start && candidate.identifier.end === identifier.end
    );
    if (reference !== void 0) return reference.resolved;
  }
  return null;
}
function variableDeclarator2(variable) {
  for (const definition of variable.defs) {
    if (definition.type === "Variable" && definition.node.type === "VariableDeclarator") {
      return definition.node;
    }
  }
  return null;
}
function knownValueEvidence(expression, scopes, boundary, visitedVariables) {
  const unwrapped = unwrapExpressionParentheses(expression);
  if (unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion") {
    if (broadTypeKind(unwrapped.typeAnnotation) !== null) return null;
    return { type: unwrapped.typeAnnotation };
  }
  if (unwrapped.type === "Literal" || unwrapped.type === "TemplateLiteral") {
    return { type: null };
  }
  if (unwrapped.type === "ArrayExpression" || unwrapped.type === "ArrowFunctionExpression" || unwrapped.type === "ClassExpression" || unwrapped.type === "FunctionExpression" || unwrapped.type === "NewExpression" || unwrapped.type === "ObjectExpression") {
    return { type: null };
  }
  if (unwrapped.type !== "Identifier") return null;
  const variable = resolvedVariableForIdentifier(scopes, unwrapped);
  if (variable === null || visitedVariables.has(variable)) return null;
  const annotatedIdentifier = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation !== null && identifier.typeAnnotation !== void 0
  );
  const annotation = annotatedIdentifier?.typeAnnotation?.typeAnnotation;
  if (annotation !== void 0 && annotatedIdentifier !== void 0) {
    if (functionBoundary(annotatedIdentifier) !== boundary || broadTypeKind(annotation) !== null) {
      return null;
    }
    return { type: annotation };
  }
  const declarator = variableDeclarator2(variable);
  if (declarator === null || declarator.parent.type !== "VariableDeclaration" || declarator.parent.kind !== "const" || declarator.init === null || variable.references.some((reference) => reference.isWrite() && !reference.init) || functionBoundary(declarator) !== boundary) {
    return null;
  }
  return knownValueEvidence(
    declarator.init,
    scopes,
    boundary,
    /* @__PURE__ */ new Set([...visitedVariables, variable])
  );
}
function widenedBinding(variable, scopes) {
  const declarator = variableDeclarator2(variable);
  if (declarator === null || declarator.parent.type !== "VariableDeclaration" || declarator.parent.kind !== "const" || declarator.id.type !== "Identifier" || declarator.init === null || variable.references.some((reference) => reference.isWrite() && !reference.init)) {
    return null;
  }
  const boundary = functionBoundary(declarator);
  const declaredType = declarator.id.typeAnnotation?.typeAnnotation;
  const initializerAssertion = assertionFromExpression(declarator.init);
  const initializerBroadKind = initializerAssertion === null ? null : broadTypeKind(initializerAssertion.typeAnnotation);
  const declaredBroadKind = declaredType === void 0 ? null : broadTypeKind(declaredType);
  const broadKind = declaredBroadKind ?? initializerBroadKind;
  if (broadKind === null) return null;
  const originalExpression = initializerAssertion !== null && initializerBroadKind !== null ? assertedExpression(initializerAssertion) : declarator.init;
  const evidence = knownValueEvidence(originalExpression, scopes, boundary, /* @__PURE__ */ new Set([variable]));
  return evidence === null ? null : { broadKind, evidence, declaredAt: declarator.end, boundary };
}
function assertionIsNarrower(sourceText, broadKind, evidence, assertedType) {
  if (broadTypeKind(assertedType) !== null) return false;
  if (broadKind === "top") return true;
  if (typesHaveSameSyntax(sourceText, evidence.type, assertedType)) return true;
  if (broadKind === "object") return isDefinitelyObjectType(assertedType);
  return isDefinitelyNarrowerRecordType(assertedType);
}
var noWidenThenAssertRule = defineRule10({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type."
    },
    messages: {
      widenThenAssert: 'Binding "{{name}}" erases established type evidence by widening the value, then reconstructs that evidence with a type assertion. Preserve the precise type end-to-end; if the input is genuinely unknown, parse it once at the boundary instead.'
    }
  },
  create(context) {
    const scopes = context.sourceCode.scopeManager.scopes;
    const checkAssertion = (node) => {
      const expression = assertedExpression(node);
      if (expression.type !== "Identifier") return;
      const variable = resolvedVariableForIdentifier(scopes, expression);
      if (variable === null) return;
      const widened = widenedBinding(variable, scopes);
      if (widened === null || node.start <= widened.declaredAt || functionBoundary(node) !== widened.boundary || !assertionIsNarrower(
        context.sourceCode.text,
        widened.broadKind,
        widened.evidence,
        node.typeAnnotation
      )) {
        return;
      }
      context.report({
        node,
        messageId: "widenThenAssert",
        data: { name: expression.name }
      });
    };
    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion
    };
  }
});

// ../../scripts/oxlint-plugin-anti-slop/index.ts
var antiSlopPlugin = definePlugin({
  meta: { name: "anti-slop" },
  rules: {
    "no-chained-type-assertions": noChainedTypeAssertionsRule,
    "no-conditional-empty-object-spread": noConditionalEmptyObjectSpreadRule,
    "no-known-value-widening": noKnownValueWideningRule,
    "no-object-parameters": noObjectParametersRule,
    "no-runtime-typeof": noRuntimeTypeofRule,
    "no-unsafe-dictionary-type": noUnsafeDictionaryTypeRule,
    "no-shape-in-symbol-names": noForbiddenTermInSymbolNamesRule,
    "no-unknown-parameters": noUnknownParametersRule,
    "no-unknown-type-aliases": noUnknownTypeAliasesRule,
    "no-widen-then-assert": noWidenThenAssertRule
  }
});
var index_default = antiSlopPlugin;
export {
  index_default as default
};

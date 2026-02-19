import { z } from "zod";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);

const convexSuccessResponse = z.object({
  status: z.literal("success"),
  value: jsonValue,
  logLines: z.array(z.string()).optional(),
});

const convexErrorResponse = z.object({
  status: z.literal("error"),
  errorMessage: z.string(),
});

const convexResponse = z.union([convexSuccessResponse, convexErrorResponse]);

function authHeaders(deployKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Convex ${deployKey}`,
  };
}

function parseConvexResponse(json: JsonValue) {
  const result = convexResponse.parse(json);
  if (result.status === "error") {
    throw new Error(result.errorMessage);
  }
  return result;
}

export async function getTableShapes(
  convexUrl: string,
  deployKey: string,
): Promise<Record<string, JsonValue>> {
  const response = await fetch(`${convexUrl}/api/shapes2`, {
    headers: authHeaders(deployKey),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  return z.record(z.string(), jsonValue).parse(json);
}

const declaredSchemaValue = z.object({
  active: z.string().nullable(),
});

export interface SchemaTable {
  tableName: string;
  indexes: JsonValue;
  searchIndexes: JsonValue;
  vectorIndexes: JsonValue;
  documentType: JsonValue;
}

const schemaTable = z.object({
  tableName: z.string(),
  indexes: jsonValue,
  searchIndexes: jsonValue,
  vectorIndexes: jsonValue,
  documentType: jsonValue,
});

const activeSchema = z.object({
  tables: z.array(schemaTable),
});

export async function getDeclaredSchema(
  convexUrl: string,
  deployKey: string,
): Promise<SchemaTable[]> {
  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: authHeaders(deployKey),
    body: JSON.stringify({
      path: "_system/frontend/getSchemas",
      args: {},
      format: "json",
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  const schemaValue = declaredSchemaValue.parse(result.value);
  if (!schemaValue.active) {
    return [];
  }
  const parsed = activeSchema.parse(JSON.parse(schemaValue.active));
  return parsed.tables;
}

export interface PaginationOpts {
  numItems: number;
  cursor: string | null;
}

const paginationResultSchema = z.object({
  page: z.array(jsonValue),
  isDone: z.boolean(),
  continueCursor: z.string(),
});

export type PaginationResult = z.infer<typeof paginationResultSchema>;

export async function queryTableData(
  convexUrl: string,
  deployKey: string,
  table: string,
  order: "asc" | "desc",
  paginationOpts: PaginationOpts,
): Promise<PaginationResult> {
  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: authHeaders(deployKey),
    body: JSON.stringify({
      path: "_system/cli/tableData",
      args: { table, order, paginationOpts },
      format: "json",
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return paginationResultSchema.parse(result.value);
}

export interface TestQueryResult {
  value: JsonValue;
  logLines: string[];
}

export function wrapQueryHandler(handlerBody: string): string {
  return [
    'import { query } from "convex:/_system/repl/wrappers.js";',
    "",
    "export default query({",
    "  handler: async (ctx) => {",
    `    ${handlerBody}`,
    "  },",
    "});",
  ].join("\n");
}

export async function runTestQuery(
  convexUrl: string,
  deployKey: string,
  source: string,
): Promise<TestQueryResult> {
  const response = await fetch(`${convexUrl}/api/run_test_function`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adminKey: deployKey,
      args: {},
      bundle: { path: "testQuery.js", source },
      format: "convex_encoded_json",
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return {
    value: result.value,
    logLines: result.logLines ?? [],
  };
}

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Variant A: registerTool with a ZodObject input schema.
export function a<Shape extends z.ZodRawShape>(
  server: McpServer,
  shape: Shape,
  h: (args: z.output<z.ZodObject<Shape>>) => Promise<CallToolResult>,
) {
  const schema = z.object(shape);
  server.registerTool("n", { description: "d", inputSchema: schema }, (args) =>
    h(args),
  );
}

// Variant B: server.tool with the shape erased, re-parsing in the callback.
export function b<Shape extends z.ZodRawShape>(
  server: McpServer,
  shape: Shape,
  h: (args: z.output<z.ZodObject<Shape>>) => Promise<CallToolResult>,
) {
  const schema = z.object(shape);
  const erased: z.ZodRawShape = shape;
  server.tool("n", "d", erased, (args) => h(schema.parse(args)));
}

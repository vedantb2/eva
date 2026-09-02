import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ShapeOutput } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export function a<Shape extends z.ZodRawShape>(
  server: McpServer,
  shape: Shape,
  cb: ToolCallback<Shape>,
) {
  server.tool("n", "d", shape, cb);
}

export function b<Shape extends z.ZodRawShape>(
  server: McpServer,
  shape: Shape,
  h: (args: ShapeOutput<Shape>) => Promise<CallToolResult>,
) {
  const cb: ToolCallback<Shape> = (args) => h(args);
  server.tool("n", "d", shape, cb);
}

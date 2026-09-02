import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ShapeOutput } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { z } from "zod";

/**
 * One Eva MCP tool, described as data rather than as a call into a server.
 *
 * Keeping the definition separate from the mounting lets the same tool be
 * served either as an ordinary MCP tool or, later, through a single code-mode
 * `execute` tool that dispatches by name.
 */
export interface EvaTool {
  readonly name: string;
  readonly description: string;
  /** true when the tool creates, changes, sends or stops something; false for pure reads. */
  readonly mutating: boolean;
  /** The zod raw shape of the tool's input, kept for JSON-schema export later. */
  readonly inputShape: z.ZodRawShape;
  /** Mounts the tool as an ordinary MCP tool (today's behaviour). */
  readonly registerFlat: (server: McpServer) => void;
  /** Parses `argsJson` at the boundary with the tool's own schema and runs the handler. */
  readonly invoke: (argsJson: string) => Promise<CallToolResult>;
}

/**
 * Builds an `EvaTool` from a name, a description, a zod raw shape and a
 * handler. The handler stays fully typed against the shape: the MCP SDK infers
 * the same argument type from the raw shape when the tool is mounted flat.
 */
export function defineTool<Shape extends z.ZodRawShape>(def: {
  name: string;
  description: string;
  mutating: boolean;
  input: Shape;
  handler: (args: ShapeOutput<Shape>) => Promise<CallToolResult>;
}): EvaTool {
  const schema = z.object(def.input);
  return {
    name: def.name,
    description: def.description,
    mutating: def.mutating,
    inputShape: def.input,
    registerFlat: (server) => {
      server.tool<Shape>(
        def.name,
        def.description,
        def.input,
        (args: ShapeOutput<Shape>) => def.handler(args),
      );
    },
    invoke: (argsJson) => def.handler(schema.parse(JSON.parse(argsJson))),
  };
}

/** Mounts every tool on the server as a flat MCP tool. */
export function mountFlat(server: McpServer, tools: readonly EvaTool[]): void {
  for (const tool of tools) tool.registerFlat(server);
}

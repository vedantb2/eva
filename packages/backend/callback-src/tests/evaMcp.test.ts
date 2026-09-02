import { expect, test } from "vitest";
import {
  buildEvaMcpServers,
  consumeEvaMcpEnvironment,
} from "../evaMcp.js";

test("buildEvaMcpServers creates the authenticated HTTP descriptor", () => {
  expect(
    buildEvaMcpServers({
      auth: "token-123",
      baseUrl: "https://example.convex.site",
    }),
  ).toEqual({
    eva: {
      type: "http",
      url: "https://example.convex.site/mcp",
      headers: { Authorization: "Bearer token-123" },
    },
  });
});

test("buildEvaMcpServers requires both environment values", () => {
  expect(buildEvaMcpServers({ auth: "token-123" })).toEqual({});
  expect(
    buildEvaMcpServers({ baseUrl: "https://example.convex.site" }),
  ).toEqual({});
  expect(buildEvaMcpServers({})).toEqual({});
});

test("consumeEvaMcpEnvironment removes credentials after reading them", () => {
  const env = {
    EVA_MCP_AUTH: "token-123",
    EVA_MCP_BASE_URL: "https://example.convex.site",
  };
  const { servers } = consumeEvaMcpEnvironment(env);

  expect(Object.keys(servers)).toEqual(["eva"]);
  expect(env).toEqual({});
});

test("consumeEvaMcpEnvironment keeps a handoff for trusted worker children", () => {
  const env = {
    EVA_MCP_AUTH: "token-123",
    EVA_MCP_BASE_URL: "https://example.convex.site",
  };
  const { workerHandoffEnv } = consumeEvaMcpEnvironment(env);

  expect(workerHandoffEnv).toEqual({
    EVA_MCP_AUTH: "token-123",
    EVA_MCP_BASE_URL: "https://example.convex.site",
  });
});

test("consumeEvaMcpEnvironment hands off nothing without full credentials", () => {
  expect(
    consumeEvaMcpEnvironment({ EVA_MCP_AUTH: "token-123" }).workerHandoffEnv,
  ).toEqual({});
  expect(consumeEvaMcpEnvironment({}).workerHandoffEnv).toEqual({});
});

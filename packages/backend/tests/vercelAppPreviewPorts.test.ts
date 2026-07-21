import { expect, test } from "vitest";
import {
  VERCEL_APP_INTERNAL_PORT,
  VERCEL_APP_PUBLIC_PORT_FALLBACK,
  vercelAppListenPort,
  vercelAppPublicPort,
  vercelExposedPortsForPublicPort,
  withVercelAppListenPort,
} from "../convex/_daytona/vercelAppPorts";

test("public proxy port follows the app port (3000 / 3001 / 5173)", () => {
  expect(vercelAppPublicPort(3000)).toBe(3000);
  expect(vercelAppPublicPort(3001)).toBe(3001);
  expect(vercelAppPublicPort(5173)).toBe(5173);
  expect(VERCEL_APP_PUBLIC_PORT_FALLBACK).toBe(3000);
});

test("reserved desktop/editor/supabase ports fall back to 3000 for app proxy", () => {
  expect(vercelAppPublicPort(6080)).toBe(3000);
  expect(vercelAppPublicPort(8080)).toBe(3000);
  expect(vercelAppPublicPort(54321)).toBe(3000);
});

test("listen port is logical+10000 so the proxy can own the public port", () => {
  expect(vercelAppListenPort(3000)).toBe(VERCEL_APP_INTERNAL_PORT);
  expect(vercelAppListenPort(3001)).toBe(13001);
  expect(vercelAppListenPort(5173)).toBe(15173);
});

test("rewrites PORT= in the launch command for any app port", () => {
  expect(
    withVercelAppListenPort(
      3000,
      "cd /tmp/repo && HOSTNAME=0.0.0.0 PORT=3000 pnpm turbo",
    ),
  ).toEqual({
    listenPort: 13000,
    publicPort: 3000,
    devCommand: "cd /tmp/repo && HOSTNAME=0.0.0.0 PORT=13000 pnpm turbo",
  });

  expect(
    withVercelAppListenPort(
      5173,
      "cd /tmp/repo && HOSTNAME=0.0.0.0 PORT=5173 pnpm --filter web dev",
    ),
  ).toEqual({
    listenPort: 15173,
    publicPort: 5173,
    devCommand:
      "cd /tmp/repo && HOSTNAME=0.0.0.0 PORT=15173 pnpm --filter web dev",
  });
});

test("expose list puts the app public port first and keeps supabase/desktop/editor", () => {
  expect(vercelExposedPortsForPublicPort(5173)).toEqual([
    5173, 8080, 6080, 54321,
  ]);
  expect(vercelExposedPortsForPublicPort(3000)).toEqual([
    3000, 8080, 6080, 54321,
  ]);
  expect(vercelExposedPortsForPublicPort(3001)).toEqual([
    3001, 8080, 6080, 54321,
  ]);
});

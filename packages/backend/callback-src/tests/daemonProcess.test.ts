import { expect, test } from "vitest";
import {
  callbackBundleWentStale,
  pidAlive,
  sleep,
} from "../runtime/daemonProcess.js";

test("sleep resolves after the requested delay", async () => {
  const started = Date.now();
  await sleep(20);
  expect(Date.now() - started).toBeGreaterThanOrEqual(15);
});

test("pidAlive reports this process as live and a fake pid as dead", () => {
  expect(pidAlive(process.pid)).toBe(true);
  expect(pidAlive(2 ** 31 - 1)).toBe(false);
});

test("callbackBundleWentStale is false when the fingerprint env is empty", () => {
  expect(callbackBundleWentStale("")).toBe(false);
});

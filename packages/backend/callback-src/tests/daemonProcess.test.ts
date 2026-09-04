import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  buildEntityMutationArgs,
  callbackBundleWentStale,
  claimDaemonPidfileBoot,
  cleanOwnedDaemonMarkers,
  pidAlive,
  readPidFromFile,
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

test("readPidFromFile returns NaN when the file is missing", () => {
  expect(readPidFromFile("/tmp/eva-missing-daemon.pid")).toBeNaN();
});

test("buildEntityMutationArgs prefixes the entity field", () => {
  expect(
    buildEntityMutationArgs("taskId", "t1", { model: "claude:sonnet" }),
  ).toEqual({ taskId: "t1", model: "claude:sonnet" });
});

test("claimDaemonPidfileBoot leaves a live rival untouched", () => {
  const dir = join(tmpdir(), `eva-daemon-claim-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const paths = {
    pid: join(dir, "d.pid"),
    entity: join(dir, "d.entity"),
    opts: join(dir, "d.opts"),
  };
  writeFileSync(paths.pid, String(process.pid));
  const claim = claimDaemonPidfileBoot({
    paths,
    entityId: "e",
    optsSig: "sig",
    currentPid: process.pid + 1,
  });
  expect(claim).toEqual({ status: "rival_alive", rivalPid: process.pid });
  expect(readPidFromFile(paths.pid)).toBe(process.pid);
  rmSync(dir, { recursive: true, force: true });
});

test("cleanOwnedDaemonMarkers only unlinks when this pid owns the file", () => {
  const dir = join(tmpdir(), `eva-daemon-clean-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const paths = {
    pid: join(dir, "d.pid"),
    entity: join(dir, "d.entity"),
    opts: join(dir, "d.opts"),
  };
  writeFileSync(paths.pid, "1");
  writeFileSync(paths.entity, "e");
  writeFileSync(paths.opts, "sig");
  cleanOwnedDaemonMarkers({
    paths,
    currentPid: process.pid,
    includeLegacySessionPaths: false,
  });
  expect(existsSync(paths.pid)).toBe(true);
  writeFileSync(paths.pid, String(process.pid));
  cleanOwnedDaemonMarkers({
    paths,
    currentPid: process.pid,
    includeLegacySessionPaths: false,
  });
  expect(existsSync(paths.pid)).toBe(false);
  rmSync(dir, { recursive: true, force: true });
});

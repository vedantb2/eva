import { expect, test } from "vitest";
import {
  PROOF_NO_MEDIA_MESSAGE,
  proofMediaCandidateRoots,
  proofMediaSearchDirs,
} from "../callback-src/runtime/proofMedia";

test("PROOF_NO_MEDIA_MESSAGE is an explicit Eva decision, not No UI changes", () => {
  expect(PROOF_NO_MEDIA_MESSAGE).toBe("Eva decided not to capture.");
  expect(PROOF_NO_MEDIA_MESSAGE).not.toMatch(/No UI changes/i);
});

test("proofMediaCandidateRoots includes app rootDirectory", () => {
  expect(proofMediaCandidateRoots("/tmp/repo", "apps/web")).toEqual([
    "/tmp/repo",
    "/tmp/repo/apps/web",
  ]);
});

test("proofMediaCandidateRoots ignores empty or unsafe rootDirectory", () => {
  expect(proofMediaCandidateRoots("/tmp/repo", "")).toEqual(["/tmp/repo"]);
  expect(proofMediaCandidateRoots("/tmp/repo", ".")).toEqual(["/tmp/repo"]);
  expect(proofMediaCandidateRoots("/tmp/repo", "../escape")).toEqual([
    "/tmp/repo",
  ]);
  expect(proofMediaCandidateRoots("/tmp/repo", "/abs")).toEqual(["/tmp/repo"]);
});

test("proofMediaSearchDirs lists recordings and screenshots under each root", () => {
  expect(proofMediaSearchDirs("/tmp/repo", "apps/web")).toEqual({
    recordings: ["/tmp/repo/recordings", "/tmp/repo/apps/web/recordings"],
    screenshots: ["/tmp/repo/screenshots", "/tmp/repo/apps/web/screenshots"],
  });
});

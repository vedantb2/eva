import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isTaskRouteSandboxTab,
  parseDiffSearchFields,
  splitCorruptedSandboxTabParam,
} from "./search-params";

test("isTaskRouteSandboxTab rejects nuqs-corrupted tab segments", () => {
  assert.equal(isTaskRouteSandboxTab("diffs"), true);
  assert.equal(
    isTaskRouteSandboxTab(
      "diffs?diffFile=apps%2Fweb%2Fapp%2F(commissioner)%2Flist%2FCHCard.tsx",
    ),
    false,
  );
  assert.equal(isTaskRouteSandboxTab("diffs?diffView=split"), false);
});

test("splitCorruptedSandboxTabParam returns null for clean tabs", () => {
  assert.equal(splitCorruptedSandboxTabParam("diffs"), null);
  assert.equal(splitCorruptedSandboxTabParam("preview"), null);
});

test("splitCorruptedSandboxTabParam peels tab and diff search from corrupted segment", () => {
  const path = "apps/web/app/(commissioner)/care_homes/list/CHCard.tsx";
  const encoded = encodeURIComponent(path);
  const result = splitCorruptedSandboxTabParam(
    `diffs?diffFile=${encoded}&diffView=split`,
  );

  assert.deepEqual(result, {
    tab: "diffs",
    diffFile: path,
    diffView: "split",
  });
});

test("splitCorruptedSandboxTabParam decodes once-encoded slash paths from URLSearchParams", () => {
  // How TanStack/qss typically serializes paths (slashes as %2F).
  const result = splitCorruptedSandboxTabParam(
    "diffs?diffFile=apps%2Fweb%2Ffoo.tsx",
  );

  assert.equal(result?.tab, "diffs");
  assert.equal(result?.diffFile, "apps/web/foo.tsx");
});

test("parseDiffSearchFields keeps only valid Diffs search keys", () => {
  assert.deepEqual(
    parseDiffSearchFields({
      diffFile: "apps/web/foo.tsx",
      diffView: "split",
    }),
    { diffFile: "apps/web/foo.tsx", diffView: "split" },
  );
  assert.deepEqual(parseDiffSearchFields({ diffView: "nope" }), {
    diffFile: undefined,
    diffView: undefined,
  });
});

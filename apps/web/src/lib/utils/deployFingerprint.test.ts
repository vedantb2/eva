import { expect, test } from "vitest";
import { fingerprintFromHtml } from "./deployFingerprint";

test("fingerprintFromHtml joins unique hashed asset urls", () => {
  const html = `
      <script type="module" src="/assets/index-abc123.js"></script>
      <link rel="modulepreload" href="/assets/vendor-xyz.js">
      <script type="module" src="/assets/index-abc123.js"></script>
    `;
  expect(fingerprintFromHtml(html)).toBe(
    "/assets/index-abc123.js|/assets/vendor-xyz.js",
  );
});

test("fingerprintFromHtml returns null when no asset scripts exist", () => {
  expect(fingerprintFromHtml("<html><body>hi</body></html>")).toBeNull();
});

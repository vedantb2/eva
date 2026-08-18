import { describe, expect, test } from "vitest";
import {
  extractFunctionSource,
  previewProxySource as proxySource,
} from "./_helpers/previewProxySource";

/**
 * Guards the Set-Cookie rewrite that keeps sandboxed-app sign-in alive inside
 * cross-site preview iframes (fix c3cbe297). Browsers silently drop
 * SameSite=Lax cookies set from a cross-site frame, so the proxy must rewrite
 * every upstream Set-Cookie to `Secure; SameSite=None; Partitioned`. If that
 * rewrite regresses, iframe sign-in breaks again with no runtime error.
 */
const rewriteSetCookieSource = extractFunctionSource(
  "function rewriteSetCookie(value) {",
);
const factory = new Function(
  `${rewriteSetCookieSource}\nreturn rewriteSetCookie;`,
);
const rewriteSetCookie: (value: string) => string = factory();

describe("previewProxy rewriteSetCookie", () => {
  test("replaces SameSite=Lax with the cross-site iframe attributes", () => {
    expect(rewriteSetCookie("sid=abc; Path=/; HttpOnly; SameSite=Lax")).toBe(
      "sid=abc; Path=/; HttpOnly; Secure; SameSite=None; Partitioned",
    );
  });

  test("adds the attributes when upstream sets none", () => {
    expect(rewriteSetCookie("sid=abc")).toBe(
      "sid=abc; Secure; SameSite=None; Partitioned",
    );
  });

  test("strips Domain so the cookie is not pinned to the localhost upstream host", () => {
    expect(
      rewriteSetCookie("sid=abc; Domain=localhost; Path=/; SameSite=Strict"),
    ).toBe("sid=abc; Path=/; Secure; SameSite=None; Partitioned");
  });

  test("does not duplicate Secure or Partitioned when already present", () => {
    const result = rewriteSetCookie(
      "sid=abc; Secure; SameSite=None; Partitioned",
    );
    expect(result).toBe("sid=abc; Secure; SameSite=None; Partitioned");
    expect(result.match(/Secure/gi)).toHaveLength(1);
    expect(result.match(/Partitioned/gi)).toHaveLength(1);
  });

  test("preserves the cookie name/value and unrelated attributes", () => {
    expect(
      rewriteSetCookie(
        "session=a=b=c; Path=/app; Max-Age=3600; HttpOnly; SameSite=Lax",
      ),
    ).toBe(
      "session=a=b=c; Path=/app; Max-Age=3600; HttpOnly; Secure; SameSite=None; Partitioned",
    );
  });
});

/**
 * Behaviour cannot cover where the rewrite is wired, so lock the two call-site
 * invariants of the fix as a source contract: the rewrite is applied to
 * Set-Cookie, and only for non-loopback clients (in-sandbox curl / agent
 * browser talk plain http to localhost and must keep their cookies untouched).
 */
describe("previewProxy Set-Cookie rewrite wiring", () => {
  test("rewrite is gated on the set-cookie header", () => {
    expect(proxySource).toContain('lower === "set-cookie" && rewriteCookies');
  });

  test("loopback clients are exempt from the cookie rewrite", () => {
    expect(proxySource).toContain("!isLoopbackRequest(clientReq)");
  });
});

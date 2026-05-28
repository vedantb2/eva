import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedOAuthRedirectUri,
  redirectUriMatchesRegistered,
} from "../convex/_mcp/redirectUri";

describe("isAllowedOAuthRedirectUri", () => {
  it("allows https and loopback http", () => {
    assert.equal(
      isAllowedOAuthRedirectUri("https://eva.carepulse.co.uk/cb"),
      true,
    );
    assert.equal(
      isAllowedOAuthRedirectUri("http://127.0.0.1:3847/callback"),
      true,
    );
  });

  it("allows native MCP client schemes", () => {
    assert.equal(
      isAllowedOAuthRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback"),
      true,
    );
  });

  it("rejects javascript and invalid URIs", () => {
    assert.equal(isAllowedOAuthRedirectUri("javascript:alert(1)"), false);
    assert.equal(isAllowedOAuthRedirectUri("not a url"), false);
  });
});

describe("redirectUriMatchesRegistered", () => {
  it("allows any redirect when nothing was registered", () => {
    assert.equal(
      redirectUriMatchesRegistered(
        "cursor://anysphere.cursor-mcp/oauth/callback",
        [],
      ),
      true,
    );
  });

  it("matches cursor scheme when registered", () => {
    assert.equal(
      redirectUriMatchesRegistered(
        "cursor://anysphere.cursor-mcp/oauth/callback",
        ["cursor://anysphere.cursor-mcp/oauth/callback"],
      ),
      true,
    );
  });

  it("rejects cursor callback when only loopback http was stored", () => {
    assert.equal(
      redirectUriMatchesRegistered(
        "cursor://anysphere.cursor-mcp/oauth/callback",
        ["http://127.0.0.1:8765/callback"],
      ),
      false,
    );
  });
});

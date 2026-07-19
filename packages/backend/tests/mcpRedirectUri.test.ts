import { describe, it, expect } from "vitest";
import {
  isAllowedOAuthRedirectUri,
  redirectUriMatchesRegistered,
} from "../convex/_mcp/redirectUri";

describe("isAllowedOAuthRedirectUri", () => {
  it("allows https and loopback http", () => {
    expect(isAllowedOAuthRedirectUri("https://eva.carepulse.co.uk/cb")).toBe(
      true,
    );
    expect(isAllowedOAuthRedirectUri("http://127.0.0.1:3847/callback")).toBe(
      true,
    );
  });

  it("allows native MCP client schemes", () => {
    expect(
      isAllowedOAuthRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback"),
    ).toBe(true);
  });

  it("rejects javascript and invalid URIs", () => {
    expect(isAllowedOAuthRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isAllowedOAuthRedirectUri("not a url")).toBe(false);
  });
});

describe("redirectUriMatchesRegistered", () => {
  it("allows any redirect when nothing was registered", () => {
    expect(
      redirectUriMatchesRegistered(
        "cursor://anysphere.cursor-mcp/oauth/callback",
        [],
      ),
    ).toBe(true);
  });

  it("matches cursor scheme when registered", () => {
    expect(
      redirectUriMatchesRegistered(
        "cursor://anysphere.cursor-mcp/oauth/callback",
        ["cursor://anysphere.cursor-mcp/oauth/callback"],
      ),
    ).toBe(true);
  });

  it("rejects cursor callback when only loopback http was stored", () => {
    expect(
      redirectUriMatchesRegistered(
        "cursor://anysphere.cursor-mcp/oauth/callback",
        ["http://127.0.0.1:8765/callback"],
      ),
    ).toBe(false);
  });
});

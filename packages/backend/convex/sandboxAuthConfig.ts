const SANDBOX_JWT_FALLBACK_ISSUER = "https://elegant-snail-639.convex.site";

export const SANDBOX_JWT_ISSUER =
  process.env.CONVEX_SITE_URL ?? SANDBOX_JWT_FALLBACK_ISSUER;

const jwksJson = process.env.SANDBOX_JWT_JWKS;
if (!jwksJson) {
  throw new Error("Missing SANDBOX_JWT_JWKS env var");
}
const jwksBase64 = btoa(jwksJson);
export const SANDBOX_JWT_JWKS_DATA_URI = `data:application/json;base64,${jwksBase64}`;

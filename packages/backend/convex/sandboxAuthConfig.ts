const SANDBOX_JWT_FALLBACK_ISSUER = "https://elegant-snail-639.convex.site";

export const SANDBOX_JWT_ISSUER =
  process.env.CONVEX_SITE_URL ?? SANDBOX_JWT_FALLBACK_ISSUER;

// auth.config.ts is evaluated at push time, so throwing here fails module
// analysis and blocks the whole push. A freshly created local backend has no
// env vars until the snapshot seed copies them in, which made that throw
// unrecoverable: the push that would make the deployment usable could never
// land. Degrade to "no sandbox provider" and log instead, so the first push
// succeeds and a later one picks the JWKS up.
const jwksJson = process.env.SANDBOX_JWT_JWKS;
if (!jwksJson) {
  console.error(
    "Missing SANDBOX_JWT_JWKS env var — sandbox JWT auth is disabled on this deployment.",
  );
}

export const SANDBOX_JWT_JWKS_DATA_URI = jwksJson
  ? `data:application/json;base64,${btoa(jwksJson)}`
  : null;

import {
  SANDBOX_JWT_ISSUER,
  SANDBOX_JWT_JWKS_DATA_URI,
} from "./sandboxAuthConfig";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
    {
      type: "customJwt" as const,
      applicationID: "convex",
      issuer: SANDBOX_JWT_ISSUER,
      jwks: SANDBOX_JWT_JWKS_DATA_URI,
      algorithm: "ES256" as const,
    },
  ],
};

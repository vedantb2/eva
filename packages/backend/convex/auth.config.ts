export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
    {
      type: "customJwt" as const,
      applicationID: "convex",
      issuer: "https://elegant-snail-639.convex.site",
      jwks: "data:application/json;base64,eyJrZXlzIjpbeyJrdHkiOiJFQyIsIngiOiIzTmxVWkF3ZXA4OFFVTXJGbFh1MEk1ZEktUWVyWjhTZ21WOG54SkFGWnFnIiwieSI6IkpPNnRpLU13VXMydWpNaGcwRlJGaDNqOF9HU0lvNU5VX28ySWJnVG1QU0UiLCJjcnYiOiJQLTI1NiIsImtpZCI6InNhbmRib3gtMSIsImFsZyI6IkVTMjU2IiwidXNlIjoic2lnIn1dfQ==",
      algorithm: "ES256" as const,
    },
  ],
};

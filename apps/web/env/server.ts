import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    ALLOWED_ORIGINS: z.string().optional().default("http://localhost:3000"),
    // CONVEX_DEPLOYMENT: z.string().min(1),
    DAYTONA_API_KEY: z.string().min(1),
    AGENT_AUTH_SECRET: z.string().optional(),
    AGENT_CLERK_USER_ID: z.string().optional(),
    FAKE_AUTH: z.string().optional(),
  },
  experimental__runtimeEnv: process.env,
});

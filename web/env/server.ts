import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    GITHUB_APP_ID: z.string().min(1),
    GITHUB_PRIVATE_KEY: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    NEXT_OPENROUTER_API_KEY: z.string().min(1),
    ALLOWED_ORIGINS: z.string().optional().default("http://localhost:3000"),
  },
  experimental__runtimeEnv: process.env,
});

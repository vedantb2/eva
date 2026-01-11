// https://env.t3.gg/docs/nextjs#create-your-schema
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    NEXT_OPENROUTER_API_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    ALLOWED_ORIGINS: z.string().optional().default("http://localhost:3000"),
  },
  experimental__runtimeEnv: process.env,
});

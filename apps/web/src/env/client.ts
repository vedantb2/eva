import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const clientEnv = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_CONVEX_URL: z.string().min(1),
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: import.meta.env,
});

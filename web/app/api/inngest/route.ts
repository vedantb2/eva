import { serve } from "inngest/next";
import { inngest, executeTask } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeTask],
});

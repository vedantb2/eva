import { serve } from "inngest/next";
import {
  inngest,
  cleanupProjectSandbox,
  startSandbox,
  stopSandbox,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [cleanupProjectSandbox, startSandbox, stopSandbox],
});

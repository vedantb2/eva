import { serve } from "inngest/next";
import {
  inngest,
  executeTask,
  cleanupProjectSandbox,
  startSandbox,
  stopSandbox,
  buildProject,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeTask,
    cleanupProjectSandbox,
    startSandbox,
    stopSandbox,
    buildProject,
  ],
});

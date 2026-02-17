import { serve } from "inngest/next";
import {
  inngest,
  executeTask,
  cleanupProjectSandbox,
  sessionExecute,
  startSandbox,
  stopSandbox,
  buildProject,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeTask,
    cleanupProjectSandbox,
    sessionExecute,
    startSandbox,
    stopSandbox,
    buildProject,
  ],
});

import { serve } from "inngest/next";
import {
  inngest,
  executeTask,
  generateResearchQuery,
  confirmResearchQuery,
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
    generateResearchQuery,
    confirmResearchQuery,
    cleanupProjectSandbox,
    sessionExecute,
    startSandbox,
    stopSandbox,
    buildProject,
  ],
});

import { serve } from "inngest/next";
import {
  inngest,
  executeTask,
  indexCodebase,
  executeSessionTask,
  cleanupSession,
  createSessionPr,
  startSandbox,
  askSession,
  planSession,
  executeResearchQuery,
  evaluateDoc,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeTask,
    indexCodebase,
    executeSessionTask,
    cleanupSession,
    createSessionPr,
    startSandbox,
    askSession,
    planSession,
    executeResearchQuery,
    evaluateDoc,
  ],
});

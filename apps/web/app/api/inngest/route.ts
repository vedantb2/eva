import { serve } from "inngest/next";
import {
  inngest,
  executeTask,
  generateResearchQuery,
  confirmResearchQuery,
  evaluateDoc,
  cleanupProjectSandbox,
  interviewQuestion,
  summarizeSession,
  sessionExecute,
  startSandbox,
  stopSandbox,
  buildProject,
  designExecute,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeTask,
    generateResearchQuery,
    confirmResearchQuery,
    evaluateDoc,
    cleanupProjectSandbox,
    interviewQuestion,
    summarizeSession,
    sessionExecute,
    startSandbox,
    stopSandbox,
    buildProject,
    designExecute,
  ],
});

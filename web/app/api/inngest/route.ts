import { serve } from "inngest/next";
import {
  inngest,
  executeTask,
  executeResearchQuery,
  evaluateDoc,
  cleanupProjectSandbox,
  interviewQuestion,
  interviewSpec,
  interviewChat,
  summarizeSession,
  sessionExecute,
  startSandbox,
  stopSandbox,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeTask,
    executeResearchQuery,
    evaluateDoc,
    cleanupProjectSandbox,
    interviewQuestion,
    interviewSpec,
    interviewChat,
    summarizeSession,
    sessionExecute,
    startSandbox,
    stopSandbox,
  ],
});

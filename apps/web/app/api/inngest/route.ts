import { serve } from "inngest/next";
import {
  inngest,
  generateResearchQuery,
  confirmResearchQuery,
  evaluateDoc,
  cleanupProjectSandbox,
  interviewQuestion,
  summarizeSession,
  sessionExecute,
  startSandbox,
  stopSandbox,
  designExecute,
  docInterview,
  docPrdUpload,
  generateTests,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateResearchQuery,
    confirmResearchQuery,
    evaluateDoc,
    cleanupProjectSandbox,
    interviewQuestion,
    summarizeSession,
    sessionExecute,
    startSandbox,
    stopSandbox,
    designExecute,
    docInterview,
    docPrdUpload,
    generateTests,
  ],
});

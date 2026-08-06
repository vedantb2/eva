export {
  list,
  get,
  getByNumId,
  create,
  update,
  remove,
} from "./_automations/crud";

export {
  triggerAutomation,
  triggerSystemAutomation,
  runNow,
} from "./_automations/triggers";

export {
  listSystemAutomations,
  setSystemAutomationState,
} from "./_automations/systemInstall";

export {
  listRuns,
  acknowledgeRun,
  countUnreadAll,
  getAutomationData,
  getRunForEmail,
  updateRunStatus,
  clearRunWorkflow,
  cancelRun,
  handleCompletion,
} from "./_automations/runs";

export {
  createTasksFromFindings,
  autoStartTask,
} from "./_automations/findings";

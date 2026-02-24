"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { ProjectChatArea } from "./ProjectChatArea";
import { ProjectTaskDetailPanel } from "./ProjectTaskDetailPanel";
import { ProjectProgressBar } from "./ProjectProgressBar";
import { PlanContextPanel } from "./PlanContextPanel";
import {
  IconChecklist,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMessageCircle,
  IconX,
  IconGitPullRequest,
} from "@tabler/icons-react";
import { Button } from "@conductor/ui";
import Link from "next/link";

interface Project {
  _id: Id<"projects">;
  title: string;
  description?: string;
  branchName?: string;
  prUrl?: string;
  sandboxId?: string;
  phase: "draft" | "finalized" | "active" | "completed";
  rawInput: string;
  generatedSpec?: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface ProjectActiveLayoutProps {
  projectId: Id<"projects">;
  project: Project;
  repoSlug: string;
  generatedSpec?: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  prUrl?: string;
}

export function ProjectActiveLayout({
  projectId,
  project,
  repoSlug,
  generatedSpec,
  conversationHistory,
  prUrl,
}: ProjectActiveLayoutProps) {
  const cleanupTriggeredRef = useRef(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(
    null,
  );

  const tasks = useQuery(api.agentTasks.listByProject, { projectId });
  const clearProjectSandbox = useMutation(api.projects.clearProjectSandbox);

  useEffect(() => {
    if (
      project.phase === "completed" &&
      project.sandboxId &&
      !cleanupTriggeredRef.current
    ) {
      cleanupTriggeredRef.current = true;
      clearProjectSandbox({ id: project._id }).catch(() => {});
    }
  }, [project.phase, project.sandboxId, project._id, clearProjectSandbox]);

  const selectedTask = tasks?.find((t) => t._id === selectedTaskId) ?? null;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
      <div
        className={`${tasksCollapsed ? "w-8" : "w-1/4"} h-full flex flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
      >
        <div
          className={`flex items-center ${tasksCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!tasksCollapsed && (
            <div className="flex flex-row items-center gap-1 mx-auto text-primary">
              <IconChecklist size={14} />
              <p className="text-sm font-semibold">Tasks</p>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="motion-press rounded-none text-primary hover:scale-[1.03] active:scale-[0.97]"
            onClick={() => setTasksCollapsed(!tasksCollapsed)}
          >
            {tasksCollapsed ? (
              <IconLayoutSidebarLeftExpand size={16} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={16} />
            )}
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {!tasksCollapsed && (
            <motion.div
              key="project-tasks-panel-content"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProjectProgressBar projectId={projectId} className="mx-3 mb-2" />
              <div className="flex-1 min-h-0 overflow-hidden">
                <ProjectTaskListPanel
                  tasks={tasks ?? []}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                />
              </div>
              {(generatedSpec || prUrl) && (
                <div className="border-t border-border/60 p-2 flex justify-center gap-2">
                  {prUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      asChild
                    >
                      <Link
                        href={prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconGitPullRequest size={14} />
                        <span className="text-xs">PR</span>
                      </Link>
                    </Button>
                  )}
                  {generatedSpec && (
                    <PlanContextPanel
                      generatedSpec={generatedSpec}
                      conversationHistory={conversationHistory}
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedTask ? (
          <ProjectTaskDetailPanel
            taskId={selectedTask._id}
            onOpenChat={() => setChatOpen(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <IconChecklist size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a task to view details
            </p>
          </div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div
            key="project-chat-side-panel"
            className="w-1/4 h-full flex flex-col overflow-hidden border-l border-border/60"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex flex-row gap-1 items-center text-primary">
                <IconMessageCircle size={14} />
                <p className="text-sm font-semibold">Chat</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="motion-press h-7 w-7 text-muted-foreground hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => setChatOpen(false)}
              >
                <IconX size={14} />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ProjectChatArea
                projectId={projectId}
                conversationHistory={project.conversationHistory}
                selectedTaskTitle={selectedTask?.title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!chatOpen && (
        <div
          className="w-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          aria-hidden
        />
      )}
    </div>
  );
}

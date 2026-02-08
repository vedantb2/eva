"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { ProjectChatArea } from "./ProjectChatArea";
import { ProjectTaskDetailPanel } from "./ProjectTaskDetailPanel";
import { ProjectProgressBar } from "./ProjectProgressBar";
import {
  IconChecklist,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMessageCircle,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@conductor/ui";

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
}

export function ProjectActiveLayout({
  projectId,
  project,
  repoSlug,
}: ProjectActiveLayoutProps) {
  const cleanupTriggeredRef = useRef(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(
    null,
  );

  const tasks = useQuery(api.agentTasks.listByProject, { projectId });

  useEffect(() => {
    if (
      project.phase === "completed" &&
      project.sandboxId &&
      !cleanupTriggeredRef.current
    ) {
      cleanupTriggeredRef.current = true;
      fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/sandbox.cleanup",
          data: { projectId: project._id, sandboxId: project.sandboxId },
        }),
      }).catch(() => {});
    }
  }, [project.phase, project.sandboxId, project._id]);

  const selectedTask = tasks?.find((t) => t._id === selectedTaskId) ?? null;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
      <div
        className={`${tasksCollapsed ? "w-8" : "w-1/4"} h-full border-r border-border flex flex-col transition-all`}
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
            className="rounded-none text-primary"
            onClick={() => setTasksCollapsed(!tasksCollapsed)}
          >
            {tasksCollapsed ? (
              <IconLayoutSidebarLeftExpand size={16} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={16} />
            )}
          </Button>
        </div>
        {!tasksCollapsed && (
          <>
            <ProjectProgressBar projectId={projectId} className="mx-3 mb-2" />
            <div className="flex-1 min-h-0 overflow-hidden">
              <ProjectTaskListPanel
                tasks={tasks ?? []}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
              />
            </div>
          </>
        )}
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
      {chatOpen && (
        <div className="w-1/4 h-full border-l border-border flex flex-col">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex flex-row gap-1 items-center text-primary">
              <IconMessageCircle size={14} />
              <p className="text-sm font-semibold">Chat</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
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
        </div>
      )}
    </div>
  );
}

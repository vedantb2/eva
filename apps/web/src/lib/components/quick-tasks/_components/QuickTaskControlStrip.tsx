"use client";

import {
  Button,
  ModelSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type ModelAccount,
  type ModelOption,
} from "@eva/ui";
import {
  IconGitBranch,
  IconInfoCircle,
  IconLoader2,
  IconMicrophone,
  IconPlayerStop,
} from "@tabler/icons-react";
import type { AIModel, api, Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { PriorityPicker } from "@/lib/components/priority/PriorityPicker";
import type { Priority } from "@/lib/components/priority/priorityMeta";
import { AssigneeSelector } from "./AssigneeSelector";
import { ProjectPicker } from "./ProjectPicker";
import { ScreenshotsToggle } from "../ScreenshotsToggle";
import { AuditToggle } from "../AuditToggle";
import { QuickTaskTagsPicker } from "./QuickTaskTagsPicker";

type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];

interface QuickTaskControlStripProps {
  /** Voice dictation is behind a per-user flag; undefined while it loads. */
  voiceEnabled: boolean | undefined;
  isListening: boolean;
  isConnecting: boolean;
  onToggleVoice: () => void;
  isLoading: boolean;

  priority: Priority | undefined;
  onPriorityChange: (priority: Priority | undefined) => void;

  users: User[] | undefined;
  assignedTo: Id<"users"> | undefined;
  onAssigneeChange: (id: Id<"users"> | undefined) => void;

  model: AIModel;
  modelOptions: ReadonlyArray<ModelOption<AIModel>>;
  accounts: ReadonlyArray<ModelAccount>;
  providerAccountId: string | null;
  onModelChange: (model: AIModel) => void;
  onProviderAccountChange: (accountId: string | null) => void;

  /** A project's base branch wins, and then the branch is read-only. */
  branchLockedToProject: boolean;
  displayBaseBranch: string;
  baseBranch: string;
  onBaseBranchChange: (branch: string) => void;

  screenshotsVideosEnabled: boolean;
  onScreenshotsChange: (value: boolean) => void;
  runAuditEnabled: boolean;
  onRunAuditChange: (value: boolean) => void;

  allTags: string[];
  selectedTags: string[];
  tagSearch: string;
  onTagSearchChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;

  projects: Project[] | undefined;
  selectedProjectId: Id<"projects"> | undefined;
  onProjectChange: (id: Id<"projects"> | undefined) => void;
  projectPickerOpen: boolean;
  onProjectPickerOpenChange: (open: boolean) => void;
  onCreateProject: () => void;
}

/**
 * The quick-task modal's two rows of task properties, between the description
 * and the footer: who and how on the first row, run options and grouping on the
 * second. Extracted so the modal file keeps only state, mutations and the
 * dialog shell.
 */
export function QuickTaskControlStrip({
  voiceEnabled,
  isListening,
  isConnecting,
  onToggleVoice,
  isLoading,
  priority,
  onPriorityChange,
  users,
  assignedTo,
  onAssigneeChange,
  model,
  modelOptions,
  accounts,
  providerAccountId,
  onModelChange,
  onProviderAccountChange,
  branchLockedToProject,
  displayBaseBranch,
  baseBranch,
  onBaseBranchChange,
  screenshotsVideosEnabled,
  onScreenshotsChange,
  runAuditEnabled,
  onRunAuditChange,
  allTags,
  selectedTags,
  tagSearch,
  onTagSearchChange,
  onToggleTag,
  onAddCustomTag,
  projects,
  selectedProjectId,
  onProjectChange,
  projectPickerOpen,
  onProjectPickerOpenChange,
  onCreateProject,
}: QuickTaskControlStripProps) {
  return (
    <div className="flex flex-col gap-1 border-t border-border px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {voiceEnabled === true ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant={
                  isListening && !isConnecting ? "destructive" : "secondary"
                }
                onClick={onToggleVoice}
                disabled={isLoading || isConnecting}
                aria-label={
                  isConnecting
                    ? "Connecting microphone"
                    : isListening
                      ? "Stop voice input"
                      : "Voice input"
                }
              >
                {isConnecting ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : isListening ? (
                  <IconPlayerStop size={14} />
                ) : (
                  <IconMicrophone size={14} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isConnecting
                ? "Connecting…"
                : isListening
                  ? "Stop recording"
                  : "Voice input"}
            </TooltipContent>
          </Tooltip>
        ) : null}

        <PriorityPicker value={priority} onChange={onPriorityChange} />

        <AssigneeSelector
          users={users}
          assignedTo={assignedTo}
          setAssignedTo={onAssigneeChange}
        />

        <div className="inline-flex items-center">
          <ModelSelect
            value={model}
            options={modelOptions}
            onValueChange={(next) => onModelChange(next)}
            accounts={accounts}
            accountId={providerAccountId}
            onAccountChange={onProviderAccountChange}
          />
        </div>

        {branchLockedToProject ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2 font-normal text-muted-foreground hover:bg-transparent"
              >
                <IconGitBranch size={14} />
                <span className="text-foreground">{displayBaseBranch}</span>
                <IconInfoCircle
                  size={12}
                  className="cursor-help text-muted-foreground"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Inherited from the project&apos;s base branch
            </TooltipContent>
          </Tooltip>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground"
              >
                <IconGitBranch size={14} />
                <span className="text-foreground">{baseBranch}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <BranchSelect
                value={baseBranch}
                onValueChange={onBaseBranchChange}
                placeholder="Select a base branch"
                className="h-8 w-full"
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ScreenshotsToggle
          value={screenshotsVideosEnabled}
          onChange={onScreenshotsChange}
        />

        <AuditToggle value={runAuditEnabled} onChange={onRunAuditChange} />

        <QuickTaskTagsPicker
          allTags={allTags}
          selectedTags={selectedTags}
          tagSearch={tagSearch}
          onTagSearchChange={onTagSearchChange}
          onToggleTag={onToggleTag}
          onAddCustomTag={onAddCustomTag}
        />

        <ProjectPicker
          projects={projects}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={onProjectChange}
          open={projectPickerOpen}
          setOpen={onProjectPickerOpenChange}
          onCreateProject={onCreateProject}
        />
      </div>
    </div>
  );
}

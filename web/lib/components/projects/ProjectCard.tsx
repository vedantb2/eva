"use client";

import { GenericId as Id } from "convex/values";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import Link from "next/link";
import { IconGitBranch, IconDotsVertical, IconTrash } from "@tabler/icons-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

interface ProjectCardCreatorProps {
  userId: Id<"users">;
}


interface ProjectCardProps {
  projectId: Id<"projects">;
  userId: Id<"users">;
  title: string;
  description?: string;
  rawInput?: string;
  branchName?: string;
  projectUrl: string;
  cardBg: string;
  onDelete: () => void;
}

export function ProjectCard({
  userId,
  title,
  description,
  rawInput,
  branchName,
  projectUrl,
  cardBg,
  onDelete,
}: ProjectCardProps) {
  return (
    <div className={`p-3 rounded-md shadow transition-all group ${cardBg}`}>
      <div className="flex items-start justify-between gap-2">
        <Link href={projectUrl} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-teal-600 transition-colors truncate">
              {title}
            </h3>
          </div>
          {description ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {description}
            </p>
          ) : rawInput ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {rawInput}
            </p>
          ) : null}
          <div className="mt-4 flex items-center justify-between">
            <UserInitials userId={userId} />
            {branchName && (
              <Tooltip content={branchName}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-neutral-500"
                  onClick={(e) => e.preventDefault()}
                >
                  <IconGitBranch size={14} />
                </Button>
              </Tooltip>
            )}
          </div>
        </Link>
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-neutral-400 hover:text-neutral-600"
              onPress={(e) => e.continuePropagation?.()}
            >
              <IconDotsVertical size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Project actions">
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              startContent={<IconTrash size={16} />}
              onPress={onDelete}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}

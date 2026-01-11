"use client";

import Link from "next/link";
import { IconFolder, IconTrash, IconChevronRight } from "@tabler/icons-react";
import { Id } from "../../../backend/convex/_generated/dataModel";

interface Project {
  _id: Id<"projects">;
  name: string;
  description?: string;
  createdAt: number;
}

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconFolder size={20} className="text-pink-600" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {project.name}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <IconTrash size={16} />
        </button>
      </div>

      {project.description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <Link
        href={`/projects/${project._id}`}
        className="flex items-center justify-between text-sm text-pink-600 hover:text-pink-700 font-medium"
      >
        <span>Open Board</span>
        <IconChevronRight size={16} />
      </Link>
    </div>
  );
}

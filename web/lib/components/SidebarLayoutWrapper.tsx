"use client";

import { Button } from "@heroui/button";
import { IconPlus } from "@tabler/icons-react";

interface SidebarLayoutWrapperProps {
  title: string;
  onAdd?: () => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayoutWrapper({
  title,
  onAdd,
  sidebar,
  children,
}: SidebarLayoutWrapperProps) {
  return (
    <div className="flex h-screen">
      <div className="w-72 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900">
        <div className="p-5 pb-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
          {onAdd && (
            <Button size="sm" color="primary" isIconOnly onPress={onAdd}>
              <IconPlus size={16} />
            </Button>
          )}
        </div>
        {sidebar}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

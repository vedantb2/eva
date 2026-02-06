"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import {
  IconPlus,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex-1 pl-1 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <div className="h-full flex flex-row overflow-hidden bg-white dark:bg-neutral-900 rounded-l-3xl">
        <div
          className={`${collapsed ? "w-10" : "w-72"} border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 transition-all duration-200`}
        >
          <div className="p-2 pt-3 pb-2 flex items-center justify-between">
            {!collapsed && (
              <>
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 pl-2">
                  {title}
                </h1>
                <div className="flex items-center gap-1">
                  {onAdd && (
                    <Button size="icon" onClick={onAdd}>
                      <IconPlus size={16} />
                    </Button>
                  )}
                </div>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={16} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={16} />
              )}
            </Button>
          </div>
          {!collapsed && sidebar}
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@conductor/ui";
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
    <div className="flex-1 pl-1 overflow-hidden bg-background">
      <div className="h-full flex flex-row overflow-hidden bg-card rounded-l-3xl">
        <div
          className={`${collapsed ? "w-10" : "w-72"} flex flex-col bg-card transition-all duration-200`}
        >
          <div
            className={`p-2 pt-3 pb-2 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
          >
            {!collapsed && (
              <>
                <h1 className="text-xl font-semibold text-foreground pl-2">
                  {title}
                </h1>
                <div className="flex items-center gap-1">
                  {onAdd && (
                    <Button size="icon-sm" onClick={onAdd}>
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

"use client";

import { useState } from "react";
import { Button, cn } from "@conductor/ui";
import {
  IconPlus,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconX,
} from "@tabler/icons-react";

interface SidebarLayoutWrapperProps {
  title: string;
  onAdd?: () => void;
  headerActions?: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayoutWrapper({
  title,
  onAdd,
  headerActions,
  sidebar,
  children,
}: SidebarLayoutWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderHeaderActions = () => {
    if (headerActions) return headerActions;
    if (!onAdd) return null;
    return (
      <Button size="icon-sm" onClick={onAdd}>
        <IconPlus size={16} />
      </Button>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="lg:hidden flex items-center gap-2 border-b border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur-sm">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setMobileOpen(true)}
        >
          <IconLayoutSidebarLeftExpand size={16} />
        </Button>
        <h1 className="text-lg font-semibold text-foreground flex-1">
          {title}
        </h1>
        {renderHeaderActions()}
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/55 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full">
          <div className="flex h-full flex-col overflow-hidden border-r border-border/70 bg-card/90 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {title}
              </h1>
              <div className="flex items-center gap-1.5">
                {renderHeaderActions()}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setMobileOpen(false)}
                >
                  <IconX size={16} />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar">
              {sidebar}
            </div>
          </div>
        </div>
      </div>

      <div className="h-full min-h-0 flex flex-row overflow-hidden">
        <div
          className={cn(
            "hidden lg:block transition-all duration-300",
            collapsed ? "w-16" : "w-72",
          )}
        >
          <div className="h-full">
            <div className="flex h-full flex-col overflow-hidden border-r border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
              <div
                className={`border-b border-border/70 px-4 py-3 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
              >
                {!collapsed && (
                  <>
                    <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                      {title}
                    </h1>
                    <div className="flex items-center gap-1.5">
                      {renderHeaderActions()}
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
              {!collapsed && (
                <div className="min-h-0 flex-1 overflow-y-auto scrollbar">
                  {sidebar}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}

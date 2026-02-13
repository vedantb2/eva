"use client";

import { useState } from "react";
import { Button } from "@conductor/ui";
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
    <div className="flex-1 overflow-hidden bg-background">
      <div className="lg:hidden flex items-center gap-2 px-3 py-2">
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
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card transform transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
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
        {sidebar}
      </div>

      <div className="h-full flex flex-row overflow-hidden">
        <div
          className={`hidden lg:flex ${collapsed ? "w-12" : "w-72"} flex-col transition-all duration-200 bg-card`}
        >
          <div
            className={`px-4 py-3 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
          >
            {!collapsed && (
              <>
                <h1 className="text-xl font-semibold text-foreground">
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
          {!collapsed && sidebar}
        </div>
        <div className="flex-1 overflow-hidden flex flex-col bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}

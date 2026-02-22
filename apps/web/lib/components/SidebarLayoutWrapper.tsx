"use client";

import { useState } from "react";
import { Button, cn } from "@conductor/ui";
import { AnimatePresence, motion } from "framer-motion";
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
      <Button size="icon-xs" onClick={onAdd}>
        <IconPlus size={16} />
      </Button>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="lg:hidden motion-base flex items-center gap-2 border-b border-border/60 bg-card/70 px-3 py-3 ">
        <Button
          size="icon-sm"
          variant="ghost"
          className="motion-press hover:scale-[1.03] active:scale-[0.97]"
          onClick={() => setMobileOpen(true)}
        >
          <IconLayoutSidebarLeftExpand size={16} />
        </Button>
        <h1 className="text-lg font-semibold text-foreground flex-1">
          {title}
        </h1>
        {renderHeaderActions()}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 bg-background/60 "
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[19.5rem]"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="h-full">
              <div className="flex h-full flex-col overflow-hidden border-r border-border/55 bg-sidebar/95 shadow-sm ">
                <div className="flex items-center justify-between border-b border-border/70 bg-sidebar-accent/30 px-4 py-3">
                  <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                    {title}
                  </h1>
                  <div className="flex items-center gap-1.5">
                    {renderHeaderActions()}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="motion-press hover:scale-[1.03] active:scale-[0.97]"
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full min-h-0 flex flex-row overflow-hidden">
        <div
          className={cn(
            "hidden lg:block overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "w-16" : "w-72",
          )}
        >
          <div className="h-full">
            <div className="flex h-full flex-col overflow-hidden border-r border-border/55 bg-sidebar/95 shadow-sm ">
              <div
                className={`border-b border-border/70 bg-sidebar-accent/30 px-4 py-3 flex items-center ${collapsed ? "justify-center" : ""}`}
              >
                <AnimatePresence initial={false} mode="wait">
                  {collapsed ? (
                    <motion.div
                      key="collapsed-header"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="motion-press flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                        onClick={() => setCollapsed(!collapsed)}
                      >
                        <IconLayoutSidebarLeftExpand size={16} />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="expanded-header"
                      className="flex w-full items-center justify-between"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                        {title}
                      </h1>
                      <div className="flex items-center gap-3">
                        {renderHeaderActions()}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="motion-press flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                          onClick={() => setCollapsed(!collapsed)}
                        >
                          <IconLayoutSidebarLeftCollapse size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="desktop-sidebar-content"
                    className="min-h-0 flex-1 overflow-y-auto scrollbar"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {sidebar}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden animate-in fade-in duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}

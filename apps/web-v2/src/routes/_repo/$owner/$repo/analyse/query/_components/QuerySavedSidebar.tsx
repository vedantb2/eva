import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconBookmark,
  IconTrash,
} from "@tabler/icons-react";
import {
  Button,
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
  CodeBlock,
} from "@conductor/ui";

interface QuerySavedSidebarProps {
  repoId: Id<"githubRepos">;
}

export function QuerySavedSidebar({ repoId }: QuerySavedSidebarProps) {
  const savedQueries = useQuery(api.savedQueries.list, { repoId });
  const removeSavedQuery = useMutation(api.savedQueries.remove);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const handleRemoveSavedQuery = async (savedQueryId: Id<"savedQueries">) => {
    await removeSavedQuery({ id: savedQueryId });
  };

  return (
    <div
      className={`flex h-full flex-col overflow-hidden pl-6 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${panelCollapsed ? "w-12" : "w-[33%]"}`}
    >
      <div
        className={`flex items-center p-2 ${panelCollapsed ? "justify-center" : ""}`}
      >
        <Button
          size="icon"
          variant="ghost"
          className="motion-press text-primary hover:scale-[1.03] active:scale-[0.97]"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
        >
          {panelCollapsed ? (
            <IconLayoutSidebarRightExpand size={16} />
          ) : (
            <IconLayoutSidebarRightCollapse size={16} />
          )}
        </Button>
        <AnimatePresence initial={false}>
          {!panelCollapsed && (
            <motion.p
              className="text-sm font-semibold text-primary"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              Saved Queries
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {!panelCollapsed && (
          <motion.div
            key="saved-queries-panel-content"
            className="flex-1 overflow-y-auto p-3 space-y-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {!savedQueries || savedQueries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <IconBookmark size={20} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  No saved queries yet
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {savedQueries.map((sq) => (
                  <motion.div
                    key={sq._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Artifact>
                      <ArtifactHeader className="px-3 py-2">
                        <ArtifactTitle className="line-clamp-2 text-xs">
                          {sq.title}
                        </ArtifactTitle>
                        <ArtifactActions>
                          <ArtifactAction
                            tooltip="Delete"
                            className="size-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveSavedQuery(sq._id)}
                          >
                            <IconTrash size={12} />
                          </ArtifactAction>
                        </ArtifactActions>
                      </ArtifactHeader>
                      <ArtifactContent className="p-2">
                        <CodeBlock
                          code={sq.query}
                          language="typescript"
                          className="max-h-20 overflow-hidden"
                        />
                      </ArtifactContent>
                    </Artifact>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@conductor/ui";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useSearch } from "@/lib/contexts/SearchContext";
import {
  IconSearch,
  IconLayoutKanban,
  IconChecklist,
  IconTerminal2,
  IconFileText,
  IconBrain,
  IconFlask,
  IconChartBar,
  IconShield,
} from "@tabler/icons-react";

const itemClass =
  "mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-accent/80 data-[selected=true]:text-primary";

const headingClass =
  "[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase";

export function SpotlightSearch() {
  const { isOpen, setIsOpen } = useSearch();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { repo, basePath } = useRepo();

  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const sessions = useQuery(api.sessions.list, { repoId: repo._id });
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const researchQueries = useQuery(api.researchQueries.list, {
    repoId: repo._id,
  });
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        hideCloseButton
        className="top-[28%] max-w-xl translate-y-0 gap-0 p-0"
      >
        <Command className="flex flex-col bg-transparent" shouldFilter>
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 focus-within:ring-2 focus-within:ring-ring/35">
            <IconSearch className="size-4 flex-shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search pages, projects, sessions..."
              value={search}
              onValueChange={setSearch}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <kbd className="rounded-md border border-border/70 bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto py-2">
            <Command.Empty className="text-sm text-muted-foreground text-center py-8">
              No results found
            </Command.Empty>

            <Command.Group heading="Pages" className={headingClass}>
              <Command.Item
                value="Projects"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/projects`)}
              >
                <IconLayoutKanban size={16} className="flex-shrink-0" />
                <span className="flex-1">Projects</span>
                <span className="text-xs text-muted-foreground">Build</span>
              </Command.Item>
              <Command.Item
                value="Quick Tasks"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/quick-tasks`)}
              >
                <IconChecklist size={16} className="flex-shrink-0" />
                <span className="flex-1">Quick Tasks</span>
                <span className="text-xs text-muted-foreground">Fix</span>
              </Command.Item>
              <Command.Item
                value="Sessions"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/sessions`)}
              >
                <IconTerminal2 size={16} className="flex-shrink-0" />
                <span className="flex-1">Sessions</span>
                <span className="text-xs text-muted-foreground">Fix</span>
              </Command.Item>
              <Command.Item
                value="Documents"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/docs`)}
              >
                <IconFileText size={16} className="flex-shrink-0" />
                <span className="flex-1">Documents</span>
                <span className="text-xs text-muted-foreground">Test</span>
              </Command.Item>
              <Command.Item
                value="Testing Arena"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/testing-arena`)}
              >
                <IconFlask size={16} className="flex-shrink-0" />
                <span className="flex-1">Testing Arena</span>
                <span className="text-xs text-muted-foreground">Test</span>
              </Command.Item>
              <Command.Item
                value="Analyse"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/analyse`)}
              >
                <IconBrain size={16} className="flex-shrink-0" />
                <span className="flex-1">Analyse</span>
                <span className="text-xs text-muted-foreground">Data</span>
              </Command.Item>
              <Command.Item
                value="Stats"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/stats`)}
              >
                <IconChartBar size={16} className="flex-shrink-0" />
                <span className="flex-1">Stats</span>
                <span className="text-xs text-muted-foreground">Analytics</span>
              </Command.Item>
              <Command.Item
                value="Settings"
                className={itemClass}
                onSelect={() => handleSelect(`${basePath}/settings`)}
              >
                <IconShield size={16} className="flex-shrink-0" />
                <span className="flex-1">Settings</span>
                <span className="text-xs text-muted-foreground">Settings</span>
              </Command.Item>
            </Command.Group>

            {search && projects && projects.length > 0 && (
              <Command.Group heading="Projects" className={headingClass}>
                {projects.map((p) => (
                  <Command.Item
                    key={p._id}
                    value={`${p.title} ${p.description ?? ""}`}
                    className={itemClass}
                    onSelect={() =>
                      handleSelect(`${basePath}/projects/${p._id}`)
                    }
                  >
                    <IconLayoutKanban size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{p.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.phase}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {search && tasks && tasks.length > 0 && (
              <Command.Group heading="Tasks" className={headingClass}>
                {tasks.map((t) => (
                  <Command.Item
                    key={t._id}
                    value={t.title}
                    className={itemClass}
                    onSelect={() => handleSelect(`${basePath}/quick-tasks`)}
                  >
                    <IconChecklist size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {search && sessions && sessions.length > 0 && (
              <Command.Group heading="Sessions" className={headingClass}>
                {sessions.map((s) => (
                  <Command.Item
                    key={s._id}
                    value={s.title}
                    className={itemClass}
                    onSelect={() =>
                      handleSelect(`${basePath}/sessions/${s._id}`)
                    }
                  >
                    <IconTerminal2 size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {search && docs && docs.length > 0 && (
              <Command.Group heading="Documents" className={headingClass}>
                {docs.map((d) => (
                  <Command.Item
                    key={d._id}
                    value={d.title}
                    className={itemClass}
                    onSelect={() => handleSelect(`${basePath}/docs/${d._id}`)}
                  >
                    <IconFileText size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{d.title}</span>
                    <span className="text-xs text-muted-foreground">Doc</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {search && docs && docs.length > 0 && (
              <Command.Group heading="Testing Arena" className={headingClass}>
                {docs.map((d) => (
                  <Command.Item
                    key={`test-${d._id}`}
                    value={`test ${d.title}`}
                    className={itemClass}
                    onSelect={() =>
                      handleSelect(`${basePath}/testing-arena/${d._id}`)
                    }
                  >
                    <IconFlask size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{d.title}</span>
                    <span className="text-xs text-muted-foreground">Test</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {search && researchQueries && researchQueries.length > 0 && (
              <Command.Group heading="Queries" className={headingClass}>
                {researchQueries.map((rq) => (
                  <Command.Item
                    key={rq._id}
                    value={rq.title}
                    className={itemClass}
                    onSelect={() =>
                      handleSelect(`${basePath}/analyse/query/${rq._id}`)
                    }
                  >
                    <IconBrain size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{rq.title}</span>
                    <span className="text-xs text-muted-foreground">
                      Analysis Query
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

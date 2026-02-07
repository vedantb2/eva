"use client";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@conductor/ui";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "conductor-backend";
import { useRepo } from "@/lib/contexts/RepoContext";
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
  "flex items-center gap-3 px-4 py-2 text-sm rounded-md mx-2 cursor-pointer text-neutral-700 dark:text-neutral-300 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary";

const headingClass =
  "[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-400 dark:[&_[cmdk-group-heading]]:text-neutral-500 [&_[cmdk-group-heading]]:uppercase";

export function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { repo, repoSlug } = useRepo();

  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const sessions = useQuery(api.sessions.list, { repoId: repo._id });
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const researchQueries = useQuery(api.researchQueries.list, {
    repoId: repo._id,
  });
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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
        className="p-0 gap-0 top-[30%] translate-y-0 max-w-lg"
      >
        <Command className="flex flex-col" shouldFilter>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <IconSearch className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Search pages, projects, sessions..."
              value={search}
              onValueChange={setSearch}
              className="flex-1 bg-transparent outline-none text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
            <kbd className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto py-2">
            <Command.Empty className="text-sm text-neutral-500 text-center py-8">
              No results found
            </Command.Empty>

            <Command.Group heading="Pages" className={headingClass}>
              <Command.Item
                value="Projects"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/projects`)}
              >
                <IconLayoutKanban className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Projects</span>
                <span className="text-xs text-neutral-400">Build</span>
              </Command.Item>
              <Command.Item
                value="Quick Tasks"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/quick-tasks`)}
              >
                <IconChecklist className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Quick Tasks</span>
                <span className="text-xs text-neutral-400">Fix</span>
              </Command.Item>
              <Command.Item
                value="Sessions"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/sessions`)}
              >
                <IconTerminal2 className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Sessions</span>
                <span className="text-xs text-neutral-400">Fix</span>
              </Command.Item>
              <Command.Item
                value="Documents"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/docs`)}
              >
                <IconFileText className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Documents</span>
                <span className="text-xs text-neutral-400">Test</span>
              </Command.Item>
              <Command.Item
                value="Testing Arena"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/testing-arena`)}
              >
                <IconFlask className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Testing Arena</span>
                <span className="text-xs text-neutral-400">Test</span>
              </Command.Item>
              <Command.Item
                value="Analyse"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/analyse`)}
              >
                <IconBrain className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Analyse</span>
                <span className="text-xs text-neutral-400">Data</span>
              </Command.Item>
              <Command.Item
                value="Stats"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/stats`)}
              >
                <IconChartBar className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Stats</span>
                <span className="text-xs text-neutral-400">Analytics</span>
              </Command.Item>
              <Command.Item
                value="Admin"
                className={itemClass}
                onSelect={() => handleSelect(`/${repoSlug}/admin`)}
              >
                <IconShield className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Admin</span>
                <span className="text-xs text-neutral-400">Settings</span>
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
                      handleSelect(`/${repoSlug}/projects/${p._id}`)
                    }
                  >
                    <IconLayoutKanban className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{p.title}</span>
                    <span className="text-xs text-neutral-400">{p.phase}</span>
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
                    onSelect={() => handleSelect(`/${repoSlug}/quick-tasks`)}
                  >
                    <IconChecklist className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-neutral-400">{t.status}</span>
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
                      handleSelect(`/${repoSlug}/sessions/${s._id}`)
                    }
                  >
                    <IconTerminal2 className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="text-xs text-neutral-400">{s.status}</span>
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
                    onSelect={() => handleSelect(`/${repoSlug}/docs/${d._id}`)}
                  >
                    <IconFileText className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{d.title}</span>
                    <span className="text-xs text-neutral-400">Doc</span>
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
                      handleSelect(`/${repoSlug}/testing-arena/${d._id}`)
                    }
                  >
                    <IconFlask className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{d.title}</span>
                    <span className="text-xs text-neutral-400">Test</span>
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
                      handleSelect(`/${repoSlug}/analyse/query/${rq._id}`)
                    }
                  >
                    <IconBrain className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{rq.title}</span>
                    <span className="text-xs text-neutral-400">
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

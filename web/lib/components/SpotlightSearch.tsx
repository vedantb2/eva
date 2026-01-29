"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Kbd } from "@heroui/kbd";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/api";
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

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CATEGORY_ORDER = [
  "Pages",
  "Projects",
  "Tasks",
  "Sessions",
  "Documents",
  "Queries",
];

export function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
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
    if (!isOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const staticPages: SearchItem[] = useMemo(
    () => [
      { id: "p-projects", title: "Projects", subtitle: "Build", category: "Pages", href: `/${repoSlug}/projects`, icon: IconLayoutKanban },
      { id: "p-tasks", title: "Quick Tasks", subtitle: "Fix", category: "Pages", href: `/${repoSlug}/quick-tasks`, icon: IconChecklist },
      { id: "p-sessions", title: "Sessions", subtitle: "Fix", category: "Pages", href: `/${repoSlug}/sessions`, icon: IconTerminal2 },
      { id: "p-docs", title: "Documents", subtitle: "Test", category: "Pages", href: `/${repoSlug}/docs`, icon: IconFileText },
      { id: "p-testing", title: "Testing Arena", subtitle: "Test", category: "Pages", href: `/${repoSlug}/testing-arena`, icon: IconFlask },
      { id: "p-analyse", title: "Analyse", subtitle: "Data", category: "Pages", href: `/${repoSlug}/analyse`, icon: IconBrain },
      { id: "p-stats", title: "Stats", subtitle: "Analytics", category: "Pages", href: `/${repoSlug}/stats`, icon: IconChartBar },
      { id: "p-admin", title: "Admin", subtitle: "Settings", category: "Pages", href: `/${repoSlug}/admin`, icon: IconShield },
    ],
    [repoSlug],
  );

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items: SearchItem[] = [];

    const filteredPages = q
      ? staticPages.filter((p) => p.title.toLowerCase().includes(q))
      : staticPages;
    items.push(...filteredPages);

    if (q) {
      projects?.forEach((p) => {
        if (
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        ) {
          items.push({
            id: p._id,
            title: p.title,
            subtitle: p.phase,
            category: "Projects",
            href: `/${repoSlug}/projects/${p._id}`,
            icon: IconLayoutKanban,
          });
        }
      });

      tasks?.forEach((t) => {
        if (t.title.toLowerCase().includes(q)) {
          items.push({
            id: t._id,
            title: t.title,
            subtitle: t.status,
            category: "Tasks",
            href: `/${repoSlug}/quick-tasks`,
            icon: IconChecklist,
          });
        }
      });

      sessions?.forEach((s) => {
        if (s.title.toLowerCase().includes(q)) {
          items.push({
            id: s._id,
            title: s.title,
            subtitle: s.status,
            category: "Sessions",
            href: `/${repoSlug}/sessions/${s._id}`,
            icon: IconTerminal2,
          });
        }
      });

      docs?.forEach((d) => {
        if (d.title.toLowerCase().includes(q)) {
          items.push({
            id: d._id,
            title: d.title,
            subtitle: "Document",
            category: "Documents",
            href: `/${repoSlug}/docs`,
            icon: IconFileText,
          });
        }
      });

      researchQueries?.forEach((rq) => {
        if (rq.title.toLowerCase().includes(q)) {
          items.push({
            id: rq._id,
            title: rq.title,
            subtitle: "Analysis Query",
            category: "Queries",
            href: `/${repoSlug}/analyse/query/${rq._id}`,
            icon: IconBrain,
          });
        }
      });
    }

    return CATEGORY_ORDER.flatMap((cat) =>
      items.filter((item) => item.category === cat),
    );
  }, [query, projects, sessions, docs, researchQueries, tasks, repoSlug, staticPages]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        (i - 1 + results.length) % Math.max(results.length, 1),
      );
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex].href);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      hideCloseButton
      backdrop="opaque"
      placement="top"
      size="lg"
      classNames={{ base: "mt-[20vh]", body: "p-0" }}
    >
      <ModalContent>
        <ModalBody>
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
            <Input
              autoFocus
              placeholder="Search pages, projects, sessions..."
              value={query}
              onValueChange={setQuery}
              onKeyDown={handleKeyDown}
              startContent={
                <IconSearch className="w-4 h-4 text-neutral-400" />
              }
              endContent={<Kbd>ESC</Kbd>}
              classNames={{ inputWrapper: "bg-transparent shadow-none" }}
            />
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">
                No results found
              </p>
            ) : (
              results.map((item, idx) => {
                const showHeader =
                  idx === 0 || results[idx - 1].category !== item.category;
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    {showHeader && (
                      <p className="px-4 py-1 text-[10px] font-semibold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
                        {item.category}
                      </p>
                    )}
                    <button
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                        idx === activeIndex
                          ? "bg-teal-100/80 dark:bg-teal-900/20 text-teal-800 dark:text-teal-200"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {item.subtitle}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

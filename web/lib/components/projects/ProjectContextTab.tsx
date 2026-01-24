"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { GenericId as Id } from "convex/values";
import {
  IconCode,
  IconFolderSearch,
  IconAlertCircle,
  IconFileCode,
  IconStack,
  IconFolders,
  IconBraces,
  IconFileText,
  IconRefresh,
} from "@tabler/icons-react";

type IndexingStatus = "pending" | "indexing" | "complete" | "error" | undefined;

interface CodebaseIndex {
  summary: string;
  techStack: {
    language: string;
    framework: string;
    other: string[];
  };
  structure: {
    entryPoints: string[];
    keyDirectories: Array<{ path: string; purpose: string }>;
  };
  patterns: {
    componentPattern: string;
    stateManagement: string;
    apiPattern: string;
  };
  keyFiles: Array<{ path: string; purpose: string; exports: string[] }>;
  conventions: {
    naming: string;
    fileStructure: string;
    imports: string;
  };
}

interface ProjectContextTabProps {
  projectId: Id<"projects">;
  codebaseIndex: string | undefined;
  indexingStatus: IndexingStatus;
  repoId: Id<"githubRepos">;
  installationId: number;
}

export function ProjectContextTab({
  projectId,
  codebaseIndex,
  indexingStatus,
  repoId,
  installationId,
}: ProjectContextTabProps) {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const parsedIndex: CodebaseIndex | null = (() => {
    if (!codebaseIndex) return null;
    try {
      const parsed = JSON.parse(codebaseIndex);
      if (parsed.type === "result" && parsed.result) {
        const jsonMatch = parsed.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return parsed;
    } catch {
      return null;
    }
  })();

  const handleIndexCodebase = async () => {
    setIsIndexing(true);
    setIndexError(null);
    try {
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/index.requested",
          data: {
            projectId,
            repoId,
            installationId,
          },
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Indexing error:", errorMessage);
      setIndexError(errorMessage);
    } finally {
      setIsIndexing(false);
    }
  };

  const isCurrentlyIndexing = indexingStatus === "indexing" || isIndexing;

  if (!parsedIndex) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="space-y-4">
          {isCurrentlyIndexing ? (
            <Card shadow="none" className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
              <CardBody className="flex flex-row items-center gap-4 py-8">
                <Spinner size="lg" color="warning" />
                <div>
                  <p className="font-medium text-warning-700 dark:text-warning-300 text-lg">
                    Indexing Codebase...
                  </p>
                  <p className="text-sm text-warning-600 dark:text-warning-400">
                    This may take 1-2 minutes. The AI is analyzing your project structure,
                    patterns, and conventions.
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                <IconFolderSearch size={40} className="text-default-400" />
              </div>
              <h3 className="text-xl font-semibold text-default-700 mb-2">
                No Codebase Context Yet
              </h3>
              <p className="text-sm text-default-500 mb-6 max-w-md">
                Index your codebase to help the AI agent understand your project structure,
                patterns, and which files to modify.
              </p>
              <Button
                color="primary"
                size="lg"
                startContent={<IconCode size={20} />}
                onPress={handleIndexCodebase}
                isLoading={isCurrentlyIndexing}
              >
                Index Codebase
              </Button>
            </div>
          )}

          {(indexingStatus === "error" || indexError) && (
            <Card shadow="none" className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <IconAlertCircle size={24} className="text-danger-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-danger-700 dark:text-danger-300">
                      Indexing Failed
                    </p>
                    <p className="text-sm text-danger-600 dark:text-danger-400">
                      There was an error analyzing the codebase.
                    </p>
                  </div>
                  <Button color="danger" variant="flat" size="sm" onPress={handleIndexCodebase}>
                    Retry
                  </Button>
                </div>
                {indexError && (
                  <div className="bg-danger-100 dark:bg-danger-900/40 p-3 rounded-lg">
                    <p className="text-xs font-mono text-danger-700 dark:text-danger-300 break-all">
                      {indexError}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCode size={24} className="text-success" />
            <h2 className="text-xl font-bold">Codebase Context</h2>
            <Chip size="sm" color="success" variant="flat">
              Indexed
            </Chip>
          </div>
          <Button
            variant="flat"
            size="sm"
            startContent={<IconRefresh size={16} />}
            onPress={handleIndexCodebase}
            isLoading={isCurrentlyIndexing}
          >
            Re-index
          </Button>
        </div>

        <Card shadow="none">
          <CardBody>
            <p className="text-default-700">{parsedIndex.summary}</p>
          </CardBody>
        </Card>

        <Card shadow="none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconStack size={20} className="text-primary" />
              <h3 className="font-semibold">Tech Stack</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-default-400 uppercase mb-1">Language</p>
                <Chip color="primary" variant="flat">
                  {parsedIndex.techStack?.language ?? "Unknown"}
                </Chip>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase mb-1">Framework</p>
                <Chip color="secondary" variant="flat">
                  {parsedIndex.techStack?.framework ?? "Unknown"}
                </Chip>
              </div>
            </div>
            {(parsedIndex.techStack?.other?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-default-400 uppercase mb-2">Dependencies</p>
                <div className="flex flex-wrap gap-1">
                  {parsedIndex.techStack?.other?.map((dep, i) => (
                    <Chip key={i} size="sm" variant="bordered">
                      {dep}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card shadow="none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconFolders size={20} className="text-primary" />
              <h3 className="font-semibold">Project Structure</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-3">
            {(parsedIndex.structure?.entryPoints?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-default-400 uppercase mb-2">Entry Points</p>
                <div className="space-y-1">
                  {parsedIndex.structure?.entryPoints?.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <IconFileCode size={14} className="text-default-400" />
                      <code className="text-primary-600 dark:text-primary-400">{entry}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(parsedIndex.structure?.keyDirectories?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-default-400 uppercase mb-2">Key Directories</p>
                <div className="space-y-2">
                  {parsedIndex.structure?.keyDirectories?.map((dir, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <IconFolders size={14} className="text-default-400 mt-0.5" />
                      <div>
                        <code className="text-primary-600 dark:text-primary-400">{dir.path}</code>
                        <span className="text-default-500 ml-2">- {dir.purpose}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card shadow="none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconBraces size={20} className="text-primary" />
              <h3 className="font-semibold">Patterns & Conventions</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <Accordion variant="splitted" selectionMode="multiple">
              <AccordionItem
                key="patterns"
                title="Code Patterns"
                classNames={{ title: "text-sm font-medium" }}
              >
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-default-400 text-xs uppercase mb-1">Component Pattern</p>
                    <p className="text-default-700">{parsedIndex.patterns?.componentPattern ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-400 text-xs uppercase mb-1">State Management</p>
                    <p className="text-default-700">{parsedIndex.patterns?.stateManagement ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-400 text-xs uppercase mb-1">API Pattern</p>
                    <p className="text-default-700">{parsedIndex.patterns?.apiPattern ?? "N/A"}</p>
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem
                key="conventions"
                title="Conventions"
                classNames={{ title: "text-sm font-medium" }}
              >
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-default-400 text-xs uppercase mb-1">Naming</p>
                    <p className="text-default-700">{parsedIndex.conventions?.naming ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-400 text-xs uppercase mb-1">File Structure</p>
                    <p className="text-default-700">{parsedIndex.conventions?.fileStructure ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-default-400 text-xs uppercase mb-1">Imports</p>
                    <p className="text-default-700">{parsedIndex.conventions?.imports ?? "N/A"}</p>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </CardBody>
        </Card>

        <Card shadow="none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconFileText size={20} className="text-primary" />
              <h3 className="font-semibold">Key Files ({parsedIndex.keyFiles?.length ?? 0})</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3">
              {parsedIndex.keyFiles?.map((file, i) => (
                <div key={i} className="p-3 bg-default-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <IconFileCode size={16} className="text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {file.path}
                      </code>
                      <p className="text-sm text-default-500 mt-1">{file.purpose}</p>
                      {(file.exports?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.exports?.map((exp, j) => (
                            <Chip key={j} size="sm" variant="flat" color="default">
                              {exp}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card shadow="none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconCode size={20} className="text-default-400" />
              <h3 className="font-semibold text-default-500">Raw JSON</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <pre className="text-xs bg-default-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(parsedIndex, null, 2)}
            </pre>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

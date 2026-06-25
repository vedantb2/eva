"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
  Spinner,
  Textarea,
  cn,
} from "@conductor/ui";
import {
  IconFile,
  IconGitMerge,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { compactRelativeTime } from "@conductor/shared/dates";
import { useQueryState } from "nuqs";
import {
  searchParser,
  DOC_VIEWER_DEFAULT_TAB,
  DOC_RECAP_DEFAULT_TAB,
  docListFilterParser,
} from "@/lib/search-params";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavListItemClass,
} from "@/lib/components/sidebar/SharedLayoutNav";

interface DocsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function DocsSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
  createRequestId,
}: DocsSidebarProps) {
  const navigate = useNavigate();
  const docs = useQuery(api.docs.list, { repoId });
  const createDoc = useMutation(api.docs.create);
  const removeDoc = useMutation(api.docs.remove).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.docs.list, { repoId });
      if (current !== undefined) {
        localStore.setQuery(
          api.docs.list,
          { repoId },
          current.filter((d) => d._id !== args.id),
        );
      }
    },
  );
  const startPrdParse = useMutation(api.docPrdWorkflow.startPrdParse);

  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
  const [docListFilter, setDocListFilter] = useQueryState(
    "docFilter",
    docListFilterParser,
  );
  const [docToDelete, setDocToDelete] = useState<{
    id: Id<"docs">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [pastedPrdContent, setPastedPrdContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  useEffect(() => {
    if (createRequestId === undefined) return;
    if (createRequestId <= lastCreateRequestIdRef.current) return;
    lastCreateRequestIdRef.current = createRequestId;
    setIsCreateDialogOpen(true);
  }, [createRequestId]);

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const byKind = docs.filter((doc) => {
      if (docListFilter === "documents") return doc.kind !== "pr-recap";
      if (docListFilter === "pr-recaps") return doc.kind === "pr-recap";
      return true;
    });
    const q = searchQuery.toLowerCase().trim();
    return q ? byKind.filter((d) => d.title.toLowerCase().includes(q)) : byKind;
  }, [docs, searchQuery, docListFilter]);

  const defaultDocTab = (kind: string | undefined) =>
    kind === "pr-recap" ? DOC_RECAP_DEFAULT_TAB : DOC_VIEWER_DEFAULT_TAB;

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;
    setIsCreating(true);
    try {
      const id = await createDoc({
        repoId,
        title: newDocTitle.trim(),
        content: "",
      });
      setNewDocTitle("");
      setIsCreateDialogOpen(false);
      navigate({ to: `${basePath}/docs/${id}/${DOC_VIEWER_DEFAULT_TAB}` });
      onNavigate?.();
    } finally {
      setIsCreating(false);
    }
  };

  const readFileContent = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Failed to read file content"));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });

  const getTitleFromContent = (content: string): string => {
    const firstLine = content
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    if (!firstLine) return "Uploaded PRD";

    const normalized = firstLine.replace(/^#+\s*/, "");
    return normalized.slice(0, 80) || "Uploaded PRD";
  };

  const createDocFromPrd = async ({
    title,
    prdContent,
  }: {
    title: string;
    prdContent: string;
  }) => {
    setIsUploading(true);
    try {
      const id = await createDoc({ repoId, title, content: prdContent });
      setIsCreateDialogOpen(false);
      setShowUploadSection(false);
      setPastedPrdContent("");
      setNewDocTitle("");
      navigate({ to: `${basePath}/docs/${id}/${DOC_VIEWER_DEFAULT_TAB}` });
      onNavigate?.();
      await startPrdParse({ docId: id });
    } catch (error) {
      console.error("PRD upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const prdContent = await readFileContent(file);
      const title = file.name.replace(/\.[^/.]+$/, "") || "Untitled";
      await createDocFromPrd({ title, prdContent });
    } catch (error) {
      console.error("PRD upload failed", error);
    }
  };

  const handlePasteUpload = async () => {
    const content = pastedPrdContent.trim();
    if (!content) return;
    const title = getTitleFromContent(content);
    await createDocFromPrd({
      title,
      prdContent: content,
    });
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const isViewing = pathname.startsWith(
        `${basePath}/docs/${docToDelete.id}`,
      );
      await removeDoc({ id: docToDelete.id });
      setDocToDelete(null);
      if (isViewing) {
        navigate({ to: `${basePath}/docs` });
        onNavigate?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        className="hidden"
        onChange={handleUploadSelect}
      />

      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder="Search docs..."
          value={searchQuery}
          onChange={(v) => setSearchQuery(v || null)}
          onClear={() => setSearchQuery(null)}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
        {docListFilter !== "pr-recaps" ? (
          <Button
            size="icon-sm"
            variant="ghost"
            className="shrink-0 text-sidebar-primary"
            onClick={() => setIsCreateDialogOpen(true)}
            title="New document"
          >
            <IconPlus size={16} />
          </Button>
        ) : null}
      </div>

      <div className="flex gap-1 px-2 pb-2">
        {(
          [
            ["all", "All"],
            ["documents", "Documents"],
            ["pr-recaps", "PR recaps"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={docListFilter === value ? "secondary" : "ghost"}
            className="h-7 flex-1 px-2 text-xs"
            onClick={() => setDocListFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex-1">
        {docs === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-4 text-center">
            <IconFile
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">No documents yet</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        ) : (
          <SharedLayoutNav layoutId="docs-nav">
            {filteredDocs.map((doc) => {
              const href = `${basePath}/docs/${doc._id}/${defaultDocTab(doc.kind)}`;
              const isSelected = pathname.startsWith(href);
              return (
                <ContextMenu key={doc._id}>
                  <ContextMenuTrigger asChild>
                    <SharedLayoutNavSurface
                      itemId={doc._id}
                      isActive={isSelected}
                      className="group mx-1"
                    >
                      <Link
                        to={href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-1.5",
                          sidebarNavListItemClass(isSelected),
                        )}
                      >
                        {doc.kind === "pr-recap" ? (
                          <IconGitMerge
                            size={14}
                            className="shrink-0 text-muted-foreground"
                          />
                        ) : null}
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {doc.title}
                        </span>
                        {doc.kind === "pr-recap" &&
                        doc.prNumber !== undefined ? (
                          <span className="shrink-0 rounded-surface border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            PR #{doc.prNumber}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "shrink-0 overflow-hidden whitespace-nowrap text-xs tabular-nums text-muted-foreground transition-all duration-150",
                            isSelected
                              ? "max-w-[80px] pl-2 opacity-100"
                              : "max-w-0 pl-0 opacity-0 group-hover:max-w-[80px] group-hover:pl-2 group-hover:opacity-100",
                          )}
                        >
                          {compactRelativeTime(
                            doc.updatedAt ?? doc._creationTime,
                          )}
                        </span>
                      </Link>
                    </SharedLayoutNavSurface>
                  </ContextMenuTrigger>
                  <ContextMenuContent onClick={(e) => e.stopPropagation()}>
                    {doc.kind !== "pr-recap" ? (
                      <ContextMenuItem
                        className="text-destructive"
                        onClick={() =>
                          setDocToDelete({ id: doc._id, title: doc.title })
                        }
                      >
                        <IconTrash size={16} />
                        Delete
                      </ContextMenuItem>
                    ) : null}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </SharedLayoutNav>
        )}
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (isUploading || isCreating) return;
          setIsCreateDialogOpen(open);
          if (!open) {
            setNewDocTitle("");
            setShowUploadSection(false);
            setPastedPrdContent("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
          </DialogHeader>
          {showUploadSection ? (
            <div className="space-y-4">
              <div className="rounded-surface border border-border bg-card p-3">
                <p className="text-sm font-medium">Upload a file</p>
                <p className="mb-3 text-sm text-muted-foreground">
                  Supported formats: .md, .txt
                </p>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <IconUpload size={14} />
                  )}
                  Click to upload
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Paste PRD content</label>
                <Textarea
                  value={pastedPrdContent}
                  onChange={(event) => setPastedPrdContent(event.target.value)}
                  placeholder="Paste your PRD here..."
                  rows={8}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowUploadSection(false);
                    setPastedPrdContent("");
                  }}
                  disabled={isUploading}
                >
                  Back
                </Button>
                <Button
                  onClick={handlePasteUpload}
                  disabled={isUploading || pastedPrdContent.trim().length === 0}
                >
                  {isUploading && <Spinner size="sm" />}
                  Upload from paste
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="e.g., User Authentication PRD"
                value={newDocTitle}
                onChange={(event) => setNewDocTitle(event.target.value)}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter" && newDocTitle.trim()) {
                    void handleCreateDoc();
                  }
                }}
              />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-control border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                onClick={() => setShowUploadSection(true)}
              >
                <IconUpload size={14} />
                Upload PRD instead
              </button>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewDocTitle("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDoc}
                  disabled={isCreating || !newDocTitle.trim()}
                >
                  {isCreating ? <Spinner size="sm" /> : "Create Document"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!docToDelete}
        onOpenChange={(v) => {
          if (!v) setDocToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{docToDelete?.title}</strong>?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This action cannot be undone. The document will be permanently
            deleted.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner size="sm" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

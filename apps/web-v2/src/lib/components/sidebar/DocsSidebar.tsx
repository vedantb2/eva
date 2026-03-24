"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
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
import { IconFile, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";

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
  const removeDoc = useMutation(api.docs.remove);
  const startPrdParse = useMutation(api.docPrdWorkflow.startPrdParse);

  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
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
    const q = searchQuery.toLowerCase().trim();
    return q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : docs;
  }, [docs, searchQuery]);

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
      navigate({ to: `${basePath}/docs/${id}` });
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
      navigate({ to: `${basePath}/docs/${id}` });
      onNavigate?.();
      await startPrdParse({
        docId: id,
        prdContent,
      });
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
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-sidebar-primary"
          onClick={() => setIsCreateDialogOpen(true)}
          title="New document"
        >
          <IconPlus size={16} />
        </Button>
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
          <div>
            {filteredDocs.map((doc) => {
              const href = `${basePath}/docs/${doc._id}`;
              const isSelected = pathname.startsWith(href);
              return (
                <ContextMenu key={doc._id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        "group mx-1 rounded-md px-3 py-3.5 transition-colors",
                        isSelected
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                      )}
                    >
                      <Link
                        to={href}
                        onClick={onNavigate}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
                      >
                        <span
                          className={cn(
                            "block truncate text-sm",
                            isSelected && "font-medium text-sidebar-primary",
                          )}
                        >
                          {doc.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(doc.updatedAt ?? doc._creationTime).fromNow()}
                        </span>
                      </Link>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={() =>
                        setDocToDelete({ id: doc._id, title: doc.title })
                      }
                    >
                      <IconTrash size={16} />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
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
              <div className="rounded-md bg-muted/40 p-3">
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Title</label>
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
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
            This action cannot be undone. The document and all its requirements
            and user flows will be permanently deleted.
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

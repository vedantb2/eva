"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  SearchInput,
  Spinner,
  Textarea,
  cn,
} from "@conductor/ui";
import { IconFile, IconTrash, IconUpload } from "@tabler/icons-react";
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";

interface DocsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  installationId: number;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function DocsSidebar({
  repoId,
  basePath,
  installationId,
  pathname,
  onNavigate,
  createRequestId,
}: DocsSidebarProps) {
  const router = useRouter();
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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pastedPrdContent, setPastedPrdContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  useEffect(() => {
    if (createRequestId === undefined) return;
    if (createRequestId <= lastCreateRequestIdRef.current) return;
    lastCreateRequestIdRef.current = createRequestId;
    createDoc({ repoId, title: "Untitled", content: "" })
      .then((id) => {
        router.push(`${basePath}/docs/${id}`);
        onNavigate?.();
      })
      .catch(console.error);
  }, [createRequestId, createDoc, repoId, basePath, onNavigate, router]);

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const q = searchQuery.toLowerCase().trim();
    return q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : docs;
  }, [docs, searchQuery]);

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
      setIsUploadDialogOpen(false);
      setPastedPrdContent("");
      router.push(`${basePath}/docs/${id}`);
      onNavigate?.();
      await startPrdParse({
        docId: id,
        prdContent,
        installationId,
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
        router.push(`${basePath}/docs`);
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

      <div className="p-2">
        <SearchInput
          placeholder="Search docs..."
          value={searchQuery}
          onChange={(v) => setSearchQuery(v || null)}
          onClear={() => setSearchQuery(null)}
          className="max-w-none"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
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
                        "group mx-1 rounded-md px-3 py-2 transition-colors",
                        isSelected
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                      )}
                    >
                      <Link
                        href={href}
                        onClick={onNavigate}
                        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
                      >
                        <span
                          className={cn(
                            "flex-1 truncate text-sm",
                            isSelected && "font-medium text-sidebar-primary",
                          )}
                        >
                          {doc.title}
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

      <div className="border-t border-sidebar-border/40 px-3 pb-2 pt-2">
        <Button
          size="sm"
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-sidebar-foreground"
          onClick={() => setIsUploadDialogOpen(true)}
          disabled={isUploading}
        >
          {isUploading ? <Spinner size="sm" /> : <IconUpload size={14} />}
          Upload PRD
        </Button>
      </div>

      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (isUploading) return;
          setIsUploadDialogOpen(open);
          if (!open) {
            setPastedPrdContent("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload PRD</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-border/70 p-3">
              <p className="text-sm font-medium">Upload a file</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Supported formats: .md, .txt
              </p>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Spinner size="sm" /> : <IconUpload size={14} />}
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
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setPastedPrdContent("");
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasteUpload}
              disabled={isUploading || pastedPrdContent.trim().length === 0}
            >
              {isUploading && <Spinner size="sm" />}
              Upload from paste
            </Button>
          </DialogFooter>
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

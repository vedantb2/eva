"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SearchInput,
  Spinner,
  cn,
} from "@conductor/ui";
import {
  IconDotsVertical,
  IconFile,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";
import { getConvexToken } from "@/app/(main)/[repo]/actions";

interface DocsSidebarProps {
  repoId: Id<"githubRepos">;
  repoSlug: string;
  installationId: number;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function DocsSidebar({
  repoId,
  repoSlug,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  useEffect(() => {
    if (createRequestId === undefined) return;
    if (createRequestId <= lastCreateRequestIdRef.current) return;
    lastCreateRequestIdRef.current = createRequestId;
    createDoc({ repoId, title: "Untitled", content: "" })
      .then((id) => {
        router.push(`/${repoSlug}/docs/${id}`);
        onNavigate?.();
      })
      .catch(console.error);
  }, [createRequestId, createDoc, repoId, repoSlug, onNavigate, router]);

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

  const handleUploadSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const prdContent = await readFileContent(file);
      const title = file.name.replace(/\.[^/.]+$/, "") || "Untitled";
      const id = await createDoc({ repoId, title, content: prdContent });
      router.push(`/${repoSlug}/docs/${id}`);
      onNavigate?.();
      const { convexToken } = await getConvexToken();
      await startPrdParse({
        docId: id,
        prdContent,
        convexToken,
        installationId,
      });
    } catch (error) {
      console.error("PRD upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const isViewing = pathname.startsWith(
        `/${repoSlug}/docs/${docToDelete.id}`,
      );
      await removeDoc({ id: docToDelete.id });
      setDocToDelete(null);
      if (isViewing) {
        router.push(`/${repoSlug}/docs`);
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
              const href = `/${repoSlug}/docs/${doc._id}`;
              const isSelected = pathname.startsWith(href);
              return (
                <div
                  key={doc._id}
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
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <IconDotsVertical size={13} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setDocToDelete({ id: doc._id, title: doc.title })
                            }
                          >
                            <IconTrash size={16} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                </div>
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
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Spinner size="sm" /> : <IconUpload size={14} />}
          Upload PRD
        </Button>
      </div>

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

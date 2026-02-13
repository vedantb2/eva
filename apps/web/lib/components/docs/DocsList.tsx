"use client";

import {
  IconFile,
  IconFileText,
  IconSearch,
  IconDotsVertical,
  IconTrash,
} from "@tabler/icons-react";
import {
  Input,
  Spinner,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import { useState, useMemo } from "react";
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

type Doc = FunctionReturnType<typeof api.docs.list>[number];

interface DocsListProps {
  docs: Doc[] | undefined;
  repoSlug: string;
}

export function DocsList({ docs, repoSlug }: DocsListProps) {
  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
  const pathname = usePathname();
  const router = useRouter();
  const removeDoc = useMutation(api.docs.remove);
  const [docToDelete, setDocToDelete] = useState<{
    id: Id<"docs">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const query = searchQuery.toLowerCase().trim();
    return query
      ? docs.filter((d) => d.title.toLowerCase().includes(query))
      : docs;
  }, [docs, searchQuery]);

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
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (docs === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <IconFile size={32} className="mb-2" />
        <p className="text-sm">No documents yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4">
          <div className="relative">
            <IconSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search docs..."
              className="h-8 text-sm pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value || null)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matches found
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const href = `/${repoSlug}/docs/${doc._id}`;
              const isSelected = pathname.startsWith(href);
              return (
                <div
                  key={doc._id}
                  className={`mx-1.5 px-2.5 py-1.5 rounded-md transition-colors duration-150 group ${
                    isSelected ? "bg-accent" : "hover:bg-muted"
                  }`}
                >
                  <Link href={href} className="flex items-center gap-3">
                    <IconFileText
                      size={16}
                      className="flex-shrink-0 text-muted-foreground"
                    />
                    <span
                      className={`truncate text-sm flex-1 ${
                        isSelected
                          ? "text-primary font-medium"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
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
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <IconDotsVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setDocToDelete({
                                id: doc._id,
                                title: doc.title,
                              })
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
            })
          )}
        </div>
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
          <div>
            <p className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong>{docToDelete?.title}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. The document and all its
              requirements and user flows will be permanently deleted.
            </p>
          </div>
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

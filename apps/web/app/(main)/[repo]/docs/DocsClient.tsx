"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DocsList } from "@/lib/components/docs/DocsList";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Spinner,
} from "@conductor/ui";
import { IconFilePlus, IconPlus, IconUpload } from "@tabler/icons-react";
import { getWorkflowTokens } from "@/app/(main)/[repo]/actions";

export function DocsClient({ children }: { children: React.ReactNode }) {
  const { repo, repoSlug } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const createDoc = useMutation(api.docs.create);
  const startPrdParse = useMutation(api.docPrdWorkflow.startPrdParse);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const id = await createDoc({
        repoId: repo._id,
        title: "Untitled",
        content: "",
      });
      router.push(`/${repoSlug}/docs/${id}`);
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

      const id = await createDoc({
        repoId: repo._id,
        title,
        content: prdContent,
      });

      router.push(`/${repoSlug}/docs/${id}`);

      const { githubToken, convexToken } = await getWorkflowTokens(
        repo.installationId,
      );
      await startPrdParse({
        docId: id,
        prdContent,
        convexToken,
        githubToken,
      });
    } catch (error) {
      console.error("PRD upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const headerActions = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        className="hidden"
        onChange={handleUploadSelect}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-xs" disabled={isCreating || isUploading}>
            {isCreating || isUploading ? (
              <Spinner size="sm" />
            ) : (
              <IconPlus size={16} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCreate}>
            <IconFilePlus size={16} />
            New Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <IconUpload size={16} />
            Upload PRD
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <SidebarLayoutWrapper
      title="Documents"
      headerActions={headerActions}
      sidebar={<DocsList docs={docs} repoSlug={repoSlug} />}
    >
      {children}
    </SidebarLayoutWrapper>
  );
}

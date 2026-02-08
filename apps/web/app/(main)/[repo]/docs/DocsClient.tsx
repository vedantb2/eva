"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocsList } from "@/lib/components/docs/DocsList";

export function DocsClient({ children }: { children: React.ReactNode }) {
  const { repo, repoSlug } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const createDoc = useMutation(api.docs.create);
  const [isCreating, setIsCreating] = useState(false);
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

  return (
    <SidebarLayoutWrapper
      title="Documents"
      onAdd={handleCreate}
      sidebar={<DocsList docs={docs} repoSlug={repoSlug} />}
    >
      {children}
    </SidebarLayoutWrapper>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import { IconPlus } from "@tabler/icons-react";
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
    <PageWrapper
      title="Documents"
      childPadding={false}
      fillHeight
      headerRight={
        <Button
          color="primary"
          startContent={<IconPlus size={16} />}
          onPress={handleCreate}
          isLoading={isCreating}
        >
          New Doc
        </Button>
      }
    >
      <div className="grid grid-cols-3 grid-rows-[1fr] flex-1 min-h-0">
        <div className="col-span-1 h-full overflow-hidden">
          <DocsList docs={docs} repoSlug={repoSlug} />
        </div>
        <div className="col-span-2 h-full overflow-hidden">
          {children}
        </div>
      </div>
    </PageWrapper>
  );
}

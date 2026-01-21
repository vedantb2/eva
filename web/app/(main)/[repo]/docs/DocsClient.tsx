"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { DocsList } from "@/lib/components/docs/DocsList";
import { DocViewer } from "@/lib/components/docs/DocViewer";

export function DocsClient() {
  const { repo } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const createDoc = useMutation(api.docs.create);
  const [selectedId, setSelectedId] = useState<Id<"docs"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedDoc = docs?.find((d) => d._id === selectedId);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const id = await createDoc({
        repoId: repo._id,
        title: "Untitled",
        content: "",
      });
      setSelectedId(id);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PageWrapper
      title="Docs"
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
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-140px)]">
        <div className="col-span-1">
          <DocsList
            docs={docs}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="col-span-2">
          <DocViewer doc={selectedDoc} onSelect={setSelectedId} />
        </div>
      </div>
    </PageWrapper>
  );
}

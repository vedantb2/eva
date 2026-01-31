"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import {
  IconPlayerPlay,
  IconFileText,
  IconSearch,
} from "@tabler/icons-react";
import { useState, useMemo } from "react";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GenericId as Id } from "convex/values";

interface Doc {
  _id: Id<"docs">;
  title: string;
}

function DocsListPanel({
  docs,
  repoSlug,
}: {
  docs: Doc[] | undefined;
  repoSlug: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const query = searchQuery.toLowerCase().trim();
    return query
      ? docs.filter((d) => d.title.toLowerCase().includes(query))
      : docs;
  }, [docs, searchQuery]);

  if (docs === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <IconFileText size={32} className="mb-2" />
        <p className="text-sm">No documents yet</p>
        <p className="text-xs mt-1">Create docs to test against</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      <div className="px-4 py-2">
        <Input
          placeholder="Search docs..."
          startContent={<IconSearch size={14} className="text-default-400" />}
          size="sm"
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
          onClear={() => setSearchQuery("")}
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-sm text-neutral-400">
            No matches found
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const href = `/${repoSlug}/testing-arena/${doc._id}`;
            const isSelected = pathname === href;
            return (
              <Link
                key={doc._id}
                href={href}
                className={`w-full text-left px-5 py-3 transition-colors flex items-center gap-3 ${
                  isSelected
                    ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                <IconFileText size={16} className="flex-shrink-0" />
                <span className="truncate text-sm">{doc.title}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export function TestingArenaClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { repo, repoSlug } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [showTestAllModal, setShowTestAllModal] = useState(false);

  const handleTestAll = async () => {
    if (!docs || docs.length === 0) return;
    setShowTestAllModal(false);
    setIsTestingAll(true);
    try {
      for (const doc of docs) {
        await fetch("/api/inngest/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "testing-arena/evaluate.doc",
            data: { docId: doc._id, repoId: repo._id },
          }),
        });
      }
    } finally {
      setIsTestingAll(false);
    }
  };

  return (
    <>
      <PageWrapper
        title="Testing Arena"
        childPadding={false}
        fillHeight
        headerRight={
          <Button
            color="primary"
            size="sm"
            startContent={<IconPlayerPlay size={16} />}
            onPress={() => setShowTestAllModal(true)}
            isLoading={isTestingAll}
            isDisabled={!docs || docs.length === 0}
          >
            Test All Docs
          </Button>
        }
      >
        <div className="grid grid-cols-3 grid-rows-[1fr] flex-1 min-h-0">
          <div className="col-span-1 h-full overflow-hidden">
            <DocsListPanel docs={docs} repoSlug={repoSlug} />
          </div>
          <div className="col-span-2 h-full overflow-hidden">{children}</div>
        </div>
      </PageWrapper>
      <Modal
        isOpen={showTestAllModal}
        onClose={() => setShowTestAllModal(false)}
      >
        <ModalContent>
          <ModalHeader>Test All Documents</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to run tests on all {docs?.length ?? 0}{" "}
              documents?
            </p>
            <p className="text-sm text-default-500 mt-2">
              This will evaluate each document against your codebase
              sequentially.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowTestAllModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleTestAll}>
              Yes save me Eva
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

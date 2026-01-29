"use client";

import { GenericId as Id } from "convex/values";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorContent, EditorProvider } from "@tiptap/react";
import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { IconTrash, IconFileText, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { useState, useEffect, useRef, useCallback } from "react";
import dayjs from "@/lib/dates";

interface Doc {
  _id: Id<"docs">;
  title: string;
  content: string;
  updatedAt: number;
}

interface DocViewerProps {
  doc: Doc | undefined;
  onSelect: (id: Id<"docs"> | null) => void;
}

export function DocViewer({ doc, onSelect }: DocViewerProps) {
  if (!doc) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-400">
        <IconFileText size={48} className="mb-3" />
        <p>Select a document to view</p>
      </div>
    );
  }
  return <DocEditor key={doc._id} doc={doc} onSelect={onSelect} />;
}

function DocEditor({
  doc,
  onSelect,
}: {
  doc: Doc;
  onSelect: (id: Id<"docs"> | null) => void;
}) {
  const sync = useTiptapSync(api.prosemirrorSync, doc._id);
  const updateDoc = useMutation(api.docs.update);
  const removeDoc = useMutation(api.docs.remove);
  const [title, setTitle] = useState(doc.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastEdited, setLastEdited] = useState(doc.updatedAt);
  const hasCreated = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setTitle(doc.title);
  }, [doc.title]);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  const handleEditorUpdate = useCallback(() => {
    setSaveStatus("saving");
    setLastEdited(Date.now());
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("saved"), 1500);
  }, []);

  useEffect(() => {
    if (!sync.isLoading && sync.initialContent === null && !hasCreated.current) {
      hasCreated.current = true;
      if (doc.content) {
        const json = generateJSON(doc.content, [StarterKit]);
        sync.create(json);
      } else {
        sync.create({ type: "doc", content: [] });
      }
    }
  }, [sync, doc.content]);

  const handleTitleBlur = () => {
    if (title !== doc.title) {
      updateDoc({ id: doc._id, title });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeDoc({ id: doc._id });
      setShowDeleteModal(false);
      onSelect(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (sync.isLoading || sync.initialContent === null) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Input
              value={title}
              onValueChange={setTitle}
              onBlur={handleTitleBlur}
              className="max-w-xs"
              size="sm"
              placeholder="Document title"
            />
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 whitespace-nowrap">
              {saveStatus === "saving" ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconCheck size={14} />
              )}
              <span>{saveStatus === "saving" ? "Saving..." : "Saved"}</span>
              <span className="mx-1">·</span>
              <span>{dayjs(lastEdited).fromNow()}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<IconTrash size={16} />}
            onPress={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar p-4">
          <EditorProvider
            content={sync.initialContent}
            extensions={[StarterKit, sync.extension]}
            immediatelyRender={false}
            onUpdate={handleEditorUpdate}
          >
            <EditorContent
              editor={null}
              className="prose dark:prose-invert max-w-none min-h-full focus-within:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none"
            />
          </EditorProvider>
        </div>
      </div>
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Delete Document</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete <strong>{doc.title}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-2">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}



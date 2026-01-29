"use client";

import { GenericId as Id } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorContent, EditorProvider } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
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
import { Tooltip } from "@heroui/tooltip";
import {
  IconTrash,
  IconFileText,
  IconCheck,
  IconLoader2,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconHistory,
  IconBookmark,
} from "@tabler/icons-react";
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
  const saveVersionMut = useMutation(api.docs.saveVersion);
  const undoVersion = useMutation(api.docs.timelineUndo);
  const redoVersion = useMutation(api.docs.timelineRedo);
  const status = useQuery(api.docs.timelineStatus, { id: doc._id });
  const [title, setTitle] = useState(doc.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastEdited, setLastEdited] = useState(doc.updatedAt);
  const [showHistory, setShowHistory] = useState(false);
  const hasCreated = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editorRef = useRef<Editor | null>(null);
  const history = useQuery(
    api.docs.timelineHistory,
    showHistory ? { id: doc._id } : "skip"
  );

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

  const handleSaveVersion = async () => {
    if (!editorRef.current) return;
    await saveVersionMut({
      id: doc._id,
      content: JSON.stringify(editorRef.current.getJSON()),
    });
  };

  const handleUndo = async () => {
    const result = await undoVersion({ id: doc._id });
    if (result && editorRef.current) {
      editorRef.current.commands.setContent(JSON.parse(result.content));
      setTitle(result.title);
    }
  };

  const handleRedo = async () => {
    const result = await redoVersion({ id: doc._id });
    if (result && editorRef.current) {
      editorRef.current.commands.setContent(JSON.parse(result.content));
      setTitle(result.title);
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
          <div className="flex items-center gap-1">
            <Tooltip content="Save version">
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onPress={handleSaveVersion}
              >
                <IconBookmark size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Undo version">
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                isDisabled={!status?.canUndo}
                onPress={handleUndo}
              >
                <IconArrowBackUp size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Redo version">
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                isDisabled={!status?.canRedo}
                onPress={handleRedo}
              >
                <IconArrowForwardUp size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Edit history">
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onPress={() => setShowHistory((v) => !v)}
                className={showHistory ? "bg-teal-100 dark:bg-teal-900/30" : ""}
              >
                <IconHistory size={16} />
              </Button>
            </Tooltip>
            {status && status.length > 0 && (
              <span className="text-xs text-neutral-400 ml-1">
                v{(status.position ?? 0) + 1}/{status.length}
              </span>
            )}
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
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
        </div>
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto scrollbar p-4">
            <EditorProvider
              content={sync.initialContent}
              extensions={[StarterKit, sync.extension]}
              immediatelyRender={false}
              onUpdate={handleEditorUpdate}
              onCreate={({ editor }) => {
                editorRef.current = editor;
              }}
            >
              <EditorContent
                editor={null}
                className="prose dark:prose-invert max-w-none min-h-full focus-within:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none"
              />
            </EditorProvider>
          </div>
          {showHistory && (
            <div className="w-64 border-l border-neutral-200 dark:border-neutral-700 overflow-y-auto scrollbar p-3">
              <p className="text-xs font-medium text-neutral-500 mb-2">
                Edit History
              </p>
              {!history || history.length === 0 ? (
                <p className="text-xs text-neutral-400">No versions saved</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.map((node) => (
                    <div
                      key={node.position}
                      className={`px-3 py-2 rounded text-xs ${
                        status?.position === node.position
                          ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      <span>v{node.position + 1}</span>
                      <span className="ml-2 truncate">{node.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

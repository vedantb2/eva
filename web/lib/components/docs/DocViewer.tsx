"use client";

import { GenericId as Id } from "convex/values";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { useEditor, EditorContent } from "@tiptap/react";
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
import { IconEdit, IconTrash, IconDeviceFloppy, IconX, IconFileText } from "@tabler/icons-react";
import { useState, useEffect } from "react";

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
  const updateDoc = useMutation(api.docs.update);
  const removeDoc = useMutation(api.docs.remove);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: doc?.content || "",
    editable: isEditing,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (doc) {
      setEditTitle(doc.title);
      editor?.commands.setContent(doc.content);
    }
  }, [doc, editor]);

  useEffect(() => {
    editor?.setEditable(isEditing);
  }, [isEditing, editor]);

  if (!doc) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-100/40 dark:bg-neutral-800 rounded-lg border border-teal-700 dark:border-teal-200 text-neutral-400">
        <IconFileText size={48} className="mb-3" />
        <p>Select a document to view</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      await updateDoc({
        id: doc._id,
        title: editTitle,
        content: editor.getHTML(),
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(doc.title);
    editor?.commands.setContent(doc.content);
    setIsEditing(false);
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

  return (
    <>
      <div className="h-full flex flex-col bg-neutral-100/40  dark:bg-neutral-800 rounded-lg border border-teal-700 dark:border-teal-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          {isEditing ? (
            <Input
              value={editTitle}
              onValueChange={setEditTitle}
              className="max-w-xs"
              size="sm"
              placeholder="Document title"
            />
          ) : (
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
              {doc.title}
            </h2>
          )}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<IconX size={16} />}
                  onPress={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  startContent={<IconDeviceFloppy size={16} />}
                  onPress={handleSave}
                  isLoading={isSaving}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<IconEdit size={16} />}
                  onPress={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<IconTrash size={16} />}
                  onPress={() => setShowDeleteModal(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EditorContent
            editor={editor}
            className={`prose dark:prose-invert max-w-none min-h-full ${
              isEditing
                ? "focus-within:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none"
                : ""
            }`}
          />
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
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

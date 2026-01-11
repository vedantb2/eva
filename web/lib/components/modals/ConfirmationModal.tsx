"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  type = "warning",
  isLoading = false,
}: ConfirmationModalProps) {
  const btnColor = type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-pink-600 hover:bg-pink-700";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="sm"
      placement="center"
      classNames={{ backdrop: "bg-black/50" }}
    >
      <ModalContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
        <ModalHeader className="text-base font-medium text-neutral-900 dark:text-neutral-100 pb-0">
          {title}
        </ModalHeader>
        <ModalBody className="pt-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
        </ModalBody>
        <ModalFooter className="pt-2">
          <Button variant="light" onPress={onClose} disabled={isLoading} size="sm">
            Cancel
          </Button>
          <Button
            onPress={onConfirm}
            isLoading={isLoading}
            size="sm"
            className={`${btnColor} text-white`}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
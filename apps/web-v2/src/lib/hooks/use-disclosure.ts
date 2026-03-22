import { useState, useCallback } from "react";

export function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onOpenChange = useCallback((value: boolean) => setIsOpen(value), []);

  return { isOpen, onOpen, onClose, onOpenChange };
}

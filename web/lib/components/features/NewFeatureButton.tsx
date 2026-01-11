"use client";

import { useState } from "react";
import { GenericId as Id } from "convex/values";
import { Button } from "@/lib/components/ui/Button";
import { NewFeatureModal } from "./NewFeatureModal";
import { IconSparkles } from "@tabler/icons-react";

interface NewFeatureButtonProps {
  columnId: Id<"columns">;
}

export function NewFeatureButton({ columnId }: NewFeatureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <IconSparkles size={16} className="mr-1" />
        New Feature
      </Button>
      <NewFeatureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        columnId={columnId}
      />
    </>
  );
}

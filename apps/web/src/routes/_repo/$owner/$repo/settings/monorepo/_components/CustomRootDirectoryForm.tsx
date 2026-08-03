"use client";

import { useState } from "react";
import { Button, Input } from "@eva/ui";
import { IconPlus } from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";

export function CustomRootDirectoryForm({
  addingPath,
  onAdd,
}: {
  addingPath: string | null;
  onAdd: (path: string) => void;
}) {
  const [customPath, setCustomPath] = useState("");

  const handleSubmit = () => {
    const trimmed = customPath.trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) return;
    onAdd(trimmed);
    setCustomPath("");
  };

  return (
    <SettingsSection
      title="Custom root directory"
      description="Add an app by path."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="e.g. apps/api"
          value={customPath}
          onChange={(e) => setCustomPath(e.target.value)}
          className="h-8 flex-1 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          disabled={
            !customPath.trim() ||
            addingPath === customPath.trim().replace(/^\/+|\/+$/g, "")
          }
          className="motion-press"
        >
          <IconPlus size={14} />
          Add
        </Button>
      </form>
    </SettingsSection>
  );
}

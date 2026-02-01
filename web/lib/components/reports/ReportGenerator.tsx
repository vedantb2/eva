"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  Select,
  SelectItem,
  Button,
  Textarea,
} from "@heroui/react";
import { IconReportAnalytics, IconLoader2 } from "@tabler/icons-react";

interface ReportGeneratorProps {
  onReportCreated?: (reportId: string) => void;
}

export function ReportGenerator({ onReportCreated }: ReportGeneratorProps) {
  const { repo } = useRepo();
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const availableTags = useQuery(api.reports.getAvailableTags, {
    repoId: repo._id,
  });

  const createReport = useMutation(api.reports.createReport);

  const handleGenerate = async () => {
    if (!selectedTag) return;
    setIsGenerating(true);
    try {
      const reportId = await createReport({
        repoId: repo._id,
        tagId: selectedTag,
        notes: notes || undefined,
      });
      onReportCreated?.(reportId);
      setNotes("");
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = availableTags === undefined;
  const hasTags = availableTags && availableTags.length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
        Generate Report
      </h3>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <IconLoader2 className="w-4 h-4 animate-spin" />
          Loading tags...
        </div>
      ) : !hasTags ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No tags found. Add tags to tasks or sessions to generate reports.
        </p>
      ) : (
        <div className="space-y-3">
          <Select
            label="Tag"
            placeholder="Select a tag to analyze"
            selectedKeys={selectedTag ? new Set([selectedTag]) : new Set()}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              setSelectedTag(typeof selected === "string" ? selected : "");
            }}
            size="sm"
            variant="bordered"
            classNames={{
              trigger:
                "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
              value: "text-neutral-900 dark:text-white",
              popoverContent: "bg-white dark:bg-neutral-800",
            }}
          >
            {availableTags.map((tag) => (
              <SelectItem key={tag}>{tag}</SelectItem>
            ))}
          </Select>

          <Textarea
            label="Notes (optional)"
            placeholder="Add context about this report..."
            value={notes}
            onValueChange={setNotes}
            size="sm"
            variant="bordered"
            minRows={2}
            maxRows={4}
            classNames={{
              inputWrapper:
                "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
              input: "text-neutral-900 dark:text-white",
            }}
          />

          <Button
            color="primary"
            size="sm"
            onPress={handleGenerate}
            isDisabled={!selectedTag || isGenerating}
            isLoading={isGenerating}
            startContent={
              !isGenerating && <IconReportAnalytics className="w-4 h-4" />
            }
            className="bg-teal-600 hover:bg-teal-700"
          >
            Generate Report
          </Button>
        </div>
      )}
    </div>
  );
}

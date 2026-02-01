"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  Select,
  SelectItem,
  Button,
  Textarea,
  Chip,
  Switch,
} from "@heroui/react";
import {
  IconReportAnalytics,
  IconLoader2,
  IconCalendar,
  IconX,
} from "@tabler/icons-react";

interface ReportGeneratorProps {
  onReportCreated?: (reportId: string) => void;
}

export function ReportGenerator({ onReportCreated }: ReportGeneratorProps) {
  const { repo } = useRepo();
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [multiTagMode, setMultiTagMode] = useState(false);
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const availableTags = useQuery(api.reports.getAvailableTags, {
    repoId: repo._id,
  });

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleGenerate = async () => {
    const primaryTag = multiTagMode
      ? selectedTags[0]
      : selectedTag;
    if (!primaryTag) return;

    setIsGenerating(true);
    try {
      // Build date range if filter is active
      let dateRange: { start: number; end: number } | undefined;
      if (showDateFilter && startDate && endDate) {
        dateRange = {
          start: new Date(startDate).getTime(),
          end: new Date(endDate + "T23:59:59.999Z").getTime(),
        };
      }

      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoId: repo._id,
          tagId: primaryTag,
          tagIds: multiTagMode && selectedTags.length > 1
            ? selectedTags
            : undefined,
          notes: notes || undefined,
          dateRange,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create report");
      }
      const { reportId } = await response.json();
      onReportCreated?.(reportId);
      setNotes("");
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = availableTags === undefined;
  const hasTags = availableTags && availableTags.length > 0;
  const canGenerate = multiTagMode
    ? selectedTags.length > 0
    : !!selectedTag;

  return (
    <section
      aria-labelledby="report-generator-heading"
      className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800"
    >
      <h3 id="report-generator-heading" className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
        Generate Report
      </h3>

      {isLoading ? (
        <div role="status" aria-label="Loading tags" className="flex items-center gap-2 text-sm text-neutral-500">
          <IconLoader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
          Loading tags...
        </div>
      ) : !hasTags ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No tags found. Add tags to tasks or sessions to generate reports.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Multi-tag toggle */}
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              aria-label="Multi-tag mode"
              isSelected={multiTagMode}
              onValueChange={(val) => {
                setMultiTagMode(val);
                if (!val) {
                  setSelectedTags([]);
                } else {
                  if (selectedTag) {
                    setSelectedTags([selectedTag]);
                  }
                }
              }}
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Multi-tag mode
            </span>
          </div>

          {multiTagMode ? (
            <>
              <Select
                label="Add Tag"
                placeholder="Select tags to include"
                selectedKeys={new Set()}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  if (typeof selected === "string") {
                    handleAddTag(selected);
                  }
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
                {availableTags
                  .filter((tag) => !selectedTags.includes(tag))
                  .map((tag) => (
                    <SelectItem key={tag}>{tag}</SelectItem>
                  ))}
              </Select>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <Chip
                      key={tag}
                      size="sm"
                      variant="flat"
                      onClose={() => handleRemoveTag(tag)}
                      classNames={{
                        base: "bg-teal-100 dark:bg-teal-900/30",
                        content: "text-teal-700 dark:text-teal-300",
                        closeButton: "text-teal-700 dark:text-teal-300",
                      }}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}
            </>
          ) : (
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
          )}

          {/* Date range filter */}
          <fieldset className="space-y-2">
            <legend className="sr-only">Date range filter</legend>
            <div className="flex items-center gap-2">
              <Switch
                size="sm"
                aria-label="Filter by date range"
                isSelected={showDateFilter}
                onValueChange={setShowDateFilter}
              />
              <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                <IconCalendar aria-hidden="true" className="w-3.5 h-3.5" />
                Filter by date range
              </span>
            </div>
            {showDateFilter && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="report-start-date" className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">
                    Start
                  </label>
                  <input
                    id="report-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="report-end-date" className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">
                    End
                  </label>
                  <input
                    id="report-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    aria-label="Clear date filter"
                    className="self-end p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    <IconX aria-hidden="true" className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </fieldset>

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
            isDisabled={!canGenerate || isGenerating}
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
    </section>
  );
}

"use client";

import type {
  AnnotationSide,
  DiffLineAnnotation,
  FileDiffMetadata,
  SelectedLineRange,
  ThemeTypes,
} from "@pierre/diffs";
import { getSingularPatch } from "@pierre/diffs";
import { PatchDiff, useStableCallback } from "@pierre/diffs/react";
import { useCallback, useMemo, useState } from "react";
import {
  buildDiffReviewComment,
  restoreReviewCommentRange,
} from "@/lib/reviewComments";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import {
  DiffCommentDraftBox,
  DiffCommentPendingCard,
} from "@/lib/components/sandbox/DiffCommentBox";

interface DiffCommentAnnotationEntry {
  readonly id: string;
  readonly kind: "draft" | "comment";
  readonly range: SelectedLineRange;
  readonly rangeLabel: string;
  readonly text: string;
}

interface DiffCommentAnnotationGroup {
  readonly entries: ReadonlyArray<DiffCommentAnnotationEntry>;
}

type DiffCommentLineAnnotation = DiffLineAnnotation<DiffCommentAnnotationGroup>;

interface ReviewableFileDiffProps {
  patch: string;
  path: string;
  diffView: "unified" | "split";
  resolvedTheme: ThemeTypes;
}

function annotationSide(range: SelectedLineRange): AnnotationSide {
  return (range.endSide ?? range.side) === "deletions"
    ? "deletions"
    : "additions";
}

function appendAnnotationEntry(
  annotations: ReadonlyArray<DiffCommentLineAnnotation>,
  range: SelectedLineRange,
  entry: DiffCommentAnnotationEntry,
): DiffCommentLineAnnotation[] {
  const side = annotationSide(range);
  const annotationIndex = annotations.findIndex(
    (annotation) =>
      annotation.side === side && annotation.lineNumber === range.end,
  );
  if (annotationIndex < 0) {
    return [
      ...annotations,
      {
        side,
        lineNumber: range.end,
        metadata: { entries: [entry] },
      },
    ];
  }
  return annotations.map((annotation, index) =>
    index === annotationIndex
      ? {
          ...annotation,
          metadata: { entries: [...annotation.metadata.entries, entry] },
        }
      : annotation,
  );
}

function createCommentId(): string {
  return crypto.randomUUID();
}

function PlainPatchDiff({
  patch,
  diffView,
  resolvedTheme,
}: Omit<ReviewableFileDiffProps, "path">) {
  return (
    <PatchDiff
      patch={patch}
      disableWorkerPool
      options={{
        diffStyle: diffView,
        theme: { light: "github-light", dark: "github-dark" },
        themeType: resolvedTheme,
      }}
    />
  );
}

function AnnotatablePatchDiff({
  patch,
  path,
  diffView,
  resolvedTheme,
  fileDiff,
  review,
}: ReviewableFileDiffProps & {
  fileDiff: FileDiffMetadata;
  review: NonNullable<ReturnType<typeof usePendingReviewComments>>;
}) {
  const [selectedLines, setSelectedLines] = useState<SelectedLineRange | null>(
    null,
  );
  const [draft, setDraft] = useState<{
    id: string;
    range: SelectedLineRange;
    rangeLabel: string;
  } | null>(null);

  const lineAnnotations = useMemo(() => {
    const persisted = review.comments
      .filter((comment) => comment.filePath === path)
      .reduce<DiffCommentLineAnnotation[]>((annotations, comment) => {
        const range = restoreReviewCommentRange(fileDiff, comment);
        if (!range) return annotations;
        return appendAnnotationEntry(annotations, range, {
          id: comment.id,
          kind: "comment",
          range,
          rangeLabel: comment.rangeLabel,
          text: comment.text,
        });
      }, []);

    if (!draft) return persisted;

    return appendAnnotationEntry(persisted, draft.range, {
      id: draft.id,
      kind: "draft",
      range: draft.range,
      rangeLabel: draft.rangeLabel,
      text: "",
    });
  }, [draft, fileDiff, path, review.comments]);

  const removeEntry = useCallback(
    (entryId: string) => {
      setSelectedLines(null);
      if (draft?.id === entryId) {
        setDraft(null);
        return;
      }
      review.remove(entryId);
    },
    [draft, review],
  );

  const submitEntry = useCallback(
    (entryId: string, text: string) => {
      if (!draft || draft.id !== entryId) return;
      const comment = buildDiffReviewComment({
        id: entryId,
        filePath: path,
        fileDiff,
        range: draft.range,
        text,
      });
      if (comment) review.add(comment);
      setSelectedLines(null);
      setDraft(null);
    },
    [draft, fileDiff, path, review],
  );

  const onLineSelectionEnd = useStableCallback(
    (range: SelectedLineRange | null) => {
      if (!range || draft !== null) return;
      const id = createCommentId();
      const preview = buildDiffReviewComment({
        id,
        filePath: path,
        fileDiff,
        range,
        text: "",
      });
      if (!preview) return;
      setSelectedLines(range);
      setDraft({
        id,
        range,
        rangeLabel: preview.rangeLabel,
      });
    },
  );

  const onLineSelected = useStableCallback(
    (range: SelectedLineRange | null) => {
      setSelectedLines(range);
    },
  );

  const hasOpenDraft = draft !== null;

  const options = useMemo(
    () => ({
      diffStyle: diffView,
      theme: { light: "github-light", dark: "github-dark" },
      themeType: resolvedTheme,
      enableLineSelection: !hasOpenDraft,
      onLineSelectionEnd,
      onLineSelected,
    }),
    [diffView, hasOpenDraft, onLineSelectionEnd, onLineSelected, resolvedTheme],
  );

  const renderAnnotation = useStableCallback(
    (annotation: DiffCommentLineAnnotation) => (
      <div className="py-1">
        {annotation.metadata.entries.map((entry) =>
          entry.kind === "draft" ? (
            <DiffCommentDraftBox
              key={entry.id}
              rangeLabel={entry.rangeLabel}
              onCancel={() => removeEntry(entry.id)}
              onSubmit={(text) => submitEntry(entry.id, text)}
            />
          ) : (
            <DiffCommentPendingCard
              key={entry.id}
              rangeLabel={entry.rangeLabel}
              text={entry.text}
              onDelete={() => removeEntry(entry.id)}
            />
          ),
        )}
      </div>
    ),
  );

  return (
    <PatchDiff<DiffCommentAnnotationGroup>
      patch={patch}
      disableWorkerPool
      options={options}
      selectedLines={selectedLines}
      lineAnnotations={lineAnnotations}
      renderAnnotation={renderAnnotation}
    />
  );
}

export function ReviewableFileDiff(props: ReviewableFileDiffProps) {
  const review = usePendingReviewComments();

  if (!review) {
    return <PlainPatchDiff {...props} />;
  }

  let fileDiff: FileDiffMetadata;
  try {
    fileDiff = getSingularPatch(props.patch);
  } catch {
    return <PlainPatchDiff {...props} />;
  }

  return (
    <AnnotatablePatchDiff {...props} fileDiff={fileDiff} review={review} />
  );
}

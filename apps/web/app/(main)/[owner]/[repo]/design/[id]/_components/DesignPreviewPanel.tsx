"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { useQueryStates } from "nuqs";
import { designTabParser, viewModeParser } from "@/lib/search-params";
import {
  Button,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import {
  IconCheck,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconPlayerPlay,
} from "@tabler/icons-react";

type DesignMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];
export type Variation = NonNullable<DesignMessage["variations"]>[number];

export const VARIATION_KEYS = ["a", "b", "c"] as const;

export function getLatestVariations(messages: DesignMessage[]): Variation[] {
  const lastWithVariations = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.variations?.length);
  return lastWithVariations?.variations ?? [];
}

interface DesignPreviewPanelProps {
  previewUrl: string | null;
  sandboxRunning: boolean;
  isArchived: boolean;
  isExecuting: boolean;
  latestVariations: Variation[];
  selectedVariationIndex: number | undefined;
  isSandboxStarting: boolean;
  onStartSandbox: () => void;
  onSelectVariation: (index: number) => void;
}

export function DesignPreviewPanel({
  previewUrl,
  sandboxRunning,
  isArchived,
  isExecuting,
  latestVariations,
  selectedVariationIndex,
  isSandboxStarting,
  onStartSandbox,
  onSelectVariation,
}: DesignPreviewPanelProps) {
  const [{ tab, view }, setDesignParams] = useQueryStates({
    tab: designTabParser,
    view: viewModeParser,
  });
  const activeTab = tab;
  const viewMode = view;

  if (latestVariations.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">
            {isExecuting
              ? "Generating designs..."
              : "Send a prompt to generate designs"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (v === "0" || v === "1" || v === "2") {
            setDesignParams({ tab: v });
          }
        }}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border">
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              if (v === "desktop" || v === "mobile") {
                setDesignParams({ view: v });
              }
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger value="desktop" className="text-xs px-2">
                <IconDeviceDesktop size={14} />
              </TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs px-2">
                <IconDeviceMobile size={14} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <TabsList className="h-8">
            {latestVariations.map((_, i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs px-3">
                Design {String.fromCharCode(65 + i)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="w-16" />
        </div>
        {latestVariations.map((variation, i) => (
          <TabsContent
            key={i}
            value={String(i)}
            className="flex-1 m-0 min-h-0 relative bg-muted/30"
          >
            <div
              className={`transition-all duration-150 ${viewMode === "mobile" ? "absolute inset-0 mx-auto my-auto max-h-[100%] aspect-[9/16] border border-border rounded-xl overflow-hidden bg-background" : "absolute inset-0"}`}
            >
              {previewUrl ? (
                <iframe
                  src={`${previewUrl}/design-preview?v=${VARIATION_KEYS[i] ?? "a"}`}
                  className="w-full h-full border-0"
                  title={variation.label}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    {sandboxRunning ? (
                      <Spinner size="md" />
                    ) : (
                      <>
                        <p className="text-sm mb-2">
                          {isArchived
                            ? "Sandbox not available for archived sessions"
                            : "Sandbox not running"}
                        </p>
                        {!isArchived && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={onStartSandbox}
                            disabled={isSandboxStarting}
                          >
                            <IconPlayerPlay size={14} />
                            {isSandboxStarting
                              ? "Starting..."
                              : "Start sandbox"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border">
          {!isArchived && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={() => onSelectVariation(Number(activeTab))}
              disabled={selectedVariationIndex === Number(activeTab)}
            >
              <IconCheck size={14} />
              {selectedVariationIndex === Number(activeTab)
                ? "Selected"
                : "Use this design"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {latestVariations[Number(activeTab)]?.label}
          </p>
        </div>
      </Tabs>
    </div>
  );
}

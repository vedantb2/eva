import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@eva/ui";
import { IconSparkles } from "@tabler/icons-react";
import { m, AnimatePresence } from "motion/react";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";

interface SessionSummaryAccordionProps {
  summary?: string[];
  summaryStreamingActivity?: string;
}

export function SessionSummaryAccordion({
  summary,
  summaryStreamingActivity,
}: SessionSummaryAccordionProps) {
  const hasSummary = Boolean(summary && summary.length > 0);
  const showSummaryStreaming = Boolean(summaryStreamingActivity);

  if (!showSummaryStreaming && !hasSummary) return null;

  return (
    <AnimatePresence initial={false}>
      <m.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Accordion
          type="single"
          collapsible
          defaultValue={showSummaryStreaming ? "summary" : undefined}
          className="w-full min-w-0 px-3 sm:px-6 bg-secondary rounded-b-3xl max-w-3xl mx-auto"
        >
          <AccordionItem value="summary" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm">
              <div className="flex flex-row gap-2 items-center text-primary">
                <IconSparkles className="size-3.5" />
                <p>Session summary</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              {showSummaryStreaming ? (
                <StreamingActivityDisplay activity={summaryStreamingActivity} />
              ) : hasSummary ? (
                <ul className="list-disc list-inside text-sm text-primary space-y-1 pl-4">
                  {summary?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </m.div>
    </AnimatePresence>
  );
}

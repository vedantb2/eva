import {
  Button,
  cn,
  Plan,
  PlanHeader,
  PlanTitle,
  PlanContent,
  PlanFooter,
  PlanTrigger,
  MessageResponse,
} from "@conductor/ui";
import { IconCode } from "@tabler/icons-react";

interface SessionPrdPlanViewProps {
  planContent: string;
  onApprovePlan: () => void;
  variant: "compact" | "panel";
}

export function SessionPrdPlanView({
  planContent,
  onApprovePlan,
  variant,
}: SessionPrdPlanViewProps) {
  const isPanel = variant === "panel";

  return (
    <Plan
      defaultOpen
      className={cn(
        isPanel ? "flex min-h-0 flex-1 flex-col" : undefined,
        !isPanel && "mb-2",
      )}
    >
      <PlanHeader className={cn("p-4", isPanel && "shrink-0")}>
        <PlanTitle>Product Requirements</PlanTitle>
        <PlanTrigger />
      </PlanHeader>
      <PlanContent
        className={cn(
          "px-3 pb-3 pt-0 sm:px-4",
          isPanel
            ? "min-h-0 flex-1 overflow-y-auto sm:pb-4"
            : "max-h-40 overflow-y-auto sm:pb-4 sm:max-h-64",
        )}
      >
        <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
          {planContent}
        </MessageResponse>
      </PlanContent>
      <PlanFooter className={cn("gap-2 px-4 pb-4 pt-0", isPanel && "shrink-0")}>
        <Button
          size="sm"
          className="motion-press bg-success text-success-foreground hover:bg-success/90 hover:scale-[1.01] active:scale-[0.99]"
          onClick={onApprovePlan}
        >
          <IconCode className="w-3.5 h-3.5" />
          Approve Plan
        </Button>
      </PlanFooter>
    </Plan>
  );
}

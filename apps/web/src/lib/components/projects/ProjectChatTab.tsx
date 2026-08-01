import { useState } from "react";
import {
  Button,
  Spinner,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Surface,
} from "@eva/ui";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { ConfirmDialog } from "@/lib/components/quick-tasks/_components/ConfirmDialog";
import { IconTrash, IconPlayerPlay } from "@tabler/icons-react";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectChatMessageList } from "./ProjectChatMessageList";
import {
  projectProjectInterview,
  type ProjectConversationMessage,
} from "./projectChatMessage.utils";

interface ProjectChatTabProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  activeWorkflowId?: string;
  initialMessages: ProjectConversationMessage[];
  streamingActivity?: string;
  onClear: () => Promise<void>;
}

export function ProjectChatTab({
  projectId,
  projectPhase,
  activeWorkflowId,
  initialMessages,
  streamingActivity,
  onClear,
}: ProjectChatTabProps) {
  const startProjectInterview = useMutation(
    api.projectInterviewWorkflow.startInterview,
  );
  const answerProjectInterview = useMutation(
    api.projectInterviewWorkflow.answerInterview,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const projection = projectProjectInterview(initialMessages);

  const isLocked =
    projectPhase === "in_progress" ||
    projectPhase === "business_review" ||
    projectPhase === "code_review" ||
    projectPhase === "completed";
  const hasActiveWorkflow = activeWorkflowId !== undefined;
  const hasStarted =
    initialMessages.length > 0 || isLoading || hasActiveWorkflow;

  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      await startProjectInterview({ projectId });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const handleAnswer = async (answer: string) => {
    const currentQuestion = projection.activeQuestion;
    if (!currentQuestion) return;
    setIsLoading(true);
    try {
      await answerProjectInterview({
        projectId,
        questionId: currentQuestion.id,
        answer,
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const handleClearChat = async () => {
    setIsClearing(true);
    try {
      await onClear();
      setConfirmClearOpen(false);
    } catch (error) {
      setIsClearing(false);
      throw error;
    }
    setIsClearing(false);
  };

  const waitingForResponse =
    projection.lastRole === "user" && (isLoading || hasActiveWorkflow);
  const canContinueInterview =
    projection.lastRole === "user" &&
    !isLoading &&
    !hasActiveWorkflow &&
    !isLocked;
  const showQuestion =
    projection.activeQuestion !== undefined && !waitingForResponse;

  if (!hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <IconPlayerPlay size={32} className="text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ready to Start Interview
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Start answering implementation questions about your project. Eva will
          generate a plan after the important decisions are resolved.
        </p>
        <Button
          size="lg"
          onClick={() => {
            void handleStartInterview();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <IconPlayerPlay className="mr-2 h-5 w-5" />
          )}
          Start Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3 max-w-5xl mx-auto w-full">
          <ProjectChatMessageList
            projection={projection}
            streamingActivity={streamingActivity}
          />
          {(isLoading || waitingForResponse) &&
            !projection.hasEmptyAssistant && (
              <div className="flex gap-3 items-center">
                <Spinner size="sm" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            )}
          {canContinueInterview && (
            <Surface
              density="tight"
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm text-muted-foreground">
                The last interview run stopped before Eva asked the next
                question.
              </span>
              <Button
                size="sm"
                onClick={() => {
                  void handleStartInterview();
                }}
              >
                Continue interview
              </Button>
            </Surface>
          )}
        </ConversationContent>
        <ConversationScrollButton resetKey={projectId} />
      </Conversation>
      <div className="p-3 sm:p-4 space-y-3 max-w-5xl mx-auto w-full">
        {showQuestion && projection.activeQuestion && (
          <MultipleChoiceQuestion
            question={projection.activeQuestion.question}
            options={projection.activeQuestion.options}
            onAnswer={handleAnswer}
            isLoading={isLoading || hasActiveWorkflow}
            questionNumber={projection.questionCount}
            trailingControls={
              <>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Answered: {projection.questionCount}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={
                    isLoading ||
                    hasActiveWorkflow ||
                    isLocked ||
                    initialMessages.length === 0
                  }
                >
                  <IconTrash className="size-4" />
                  Clear
                </Button>
              </>
            }
          />
        )}
      </div>
      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear interview transcript?"
        description="This deletes the Q&A history for this project so you can restart the interview from scratch."
        detail="The sandbox, generated spec, and any tasks are not affected."
        confirmLabel="Clear transcript"
        variant="destructive"
        onConfirm={() => {
          void handleClearChat();
        }}
        isLoading={isClearing}
      />
    </div>
  );
}

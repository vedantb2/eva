import { PromptInputSubmit, usePromptInputController } from "@conductor/ui";

interface SessionPromptSubmitProps {
  disabled: boolean;
  isExecuting: boolean;
  status: "submitted" | undefined;
}

export function SessionPromptSubmit({
  disabled,
  isExecuting,
  status,
}: SessionPromptSubmitProps) {
  const { textInput } = usePromptInputController();
  const isEmpty = textInput.value.trim().length === 0;

  return (
    <PromptInputSubmit
      status={status}
      disabled={disabled || isEmpty}
      title={isExecuting ? "Queue message" : "Send message"}
    />
  );
}

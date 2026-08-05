"use client";

import {
  IconLoader2,
  IconMicrophone,
  IconPlayerStop,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@eva/backend";
import {
  PromptInputButton,
  getSpeechRecognition,
  usePromptInputController,
  useSpeechRecognition,
} from "@eva/ui";
import { useGatewayDictation } from "@/lib/hooks/useGatewayDictation";

/**
 * Mic control for chat composers. When voice dictation is enabled, streams
 * through AI Gateway STT; otherwise falls back to the browser Web Speech API
 * wired through the prompt controller (fixes the old textarea-query no-op).
 */
export function ComposerSpeechButton({ disabled }: { disabled?: boolean }) {
  const flags = useQuery(api.auth.getExperimentalFlags);
  const voiceEnabled = flags?.voiceDictation;
  const { textInput } = usePromptInputController();

  if (voiceEnabled === true) {
    return (
      <GatewaySpeechButton
        disabled={disabled}
        value={textInput.value}
        setInput={textInput.setInput}
      />
    );
  }

  if (voiceEnabled === false && getSpeechRecognition()) {
    return (
      <WebSpeechButton
        disabled={disabled}
        value={textInput.value}
        setInput={textInput.setInput}
      />
    );
  }

  // Still loading the flag, or web speech unavailable with flag off.
  return null;
}

function GatewaySpeechButton({
  disabled,
  value,
  setInput,
}: {
  disabled?: boolean;
  value: string;
  setInput: (value: string) => void;
}) {
  const { isListening, isConnecting, toggle } = useGatewayDictation(setInput);

  return (
    <PromptInputButton
      tooltip={
        isConnecting
          ? "Connecting…"
          : isListening
            ? "Stop recording"
            : "Voice input"
      }
      onClick={() => toggle(value)}
      disabled={disabled || isConnecting}
      className={isListening && !isConnecting ? "text-destructive" : undefined}
    >
      {isConnecting ? (
        <IconLoader2 className="size-4 animate-spin" />
      ) : isListening ? (
        <IconPlayerStop className="size-4" />
      ) : (
        <IconMicrophone className="size-4" />
      )}
    </PromptInputButton>
  );
}

function WebSpeechButton({
  disabled,
  value,
  setInput,
}: {
  disabled?: boolean;
  value: string;
  setInput: (value: string) => void;
}) {
  const { isListening, toggle } = useSpeechRecognition(setInput);

  return (
    <PromptInputButton
      tooltip={isListening ? "Stop recording" : "Voice input"}
      onClick={() => toggle(value)}
      disabled={disabled}
      className={isListening ? "text-destructive" : undefined}
    >
      {isListening ? (
        <IconPlayerStop className="size-4" />
      ) : (
        <IconMicrophone className="size-4" />
      )}
    </PromptInputButton>
  );
}

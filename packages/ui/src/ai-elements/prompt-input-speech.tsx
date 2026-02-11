"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconMicrophone, IconPlayerStop } from "@tabler/icons-react";
import { PromptInputButton } from "./prompt-input";

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function useSpeechRecognition(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) onResultRef.current(transcript);
    };

    recognition.onerror = () => {
      stop();
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [stop]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => stop, [stop]);

  return { isListening, toggle };
}

interface PromptInputSpeechProps {
  disabled?: boolean;
}

export function PromptInputSpeech({ disabled }: PromptInputSpeechProps) {
  if (!getSpeechRecognition()) return null;

  return <SpeechButton disabled={disabled} />;
}

function SpeechButton({ disabled }: PromptInputSpeechProps) {
  const appendText = useCallback((transcript: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="message"]',
    );
    if (!textarea) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    if (!nativeInputValueSetter) return;

    const current = textarea.value;
    const separator = current && !current.endsWith(" ") ? " " : "";
    nativeInputValueSetter.call(textarea, current + separator + transcript);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  }, []);

  const { isListening, toggle } = useSpeechRecognition(appendText);

  return (
    <PromptInputButton
      tooltip={isListening ? "Stop recording" : "Voice input"}
      onClick={toggle}
      disabled={disabled}
      className={isListening ? "text-destructive" : ""}
    >
      {isListening ? (
        <IconPlayerStop className="size-4" />
      ) : (
        <IconMicrophone className="size-4" />
      )}
    </PromptInputButton>
  );
}

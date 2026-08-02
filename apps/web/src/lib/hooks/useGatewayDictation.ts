"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import { toast } from "@eva/ui";

export type GatewayDictationStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "error";

const TARGET_SAMPLE_RATE = 24_000;

/**
 * Inline AudioWorklet: Float32 mic frames → Int16 LE mono PCM at 24 kHz,
 * resampling when the AudioContext cannot run at that rate.
 */
const PCM_WORKLET_SOURCE = `
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || input.length === 0) return true;
    const ratio = sampleRate / ${TARGET_SAMPLE_RATE};
    const outLen = Math.max(1, Math.floor(input.length / ratio));
    const pcm = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcIndex = i * ratio;
      const i0 = Math.floor(srcIndex);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const frac = srcIndex - i0;
      const sample = input[i0] * (1 - frac) + input[i1] * frac;
      const clipped = Math.max(-1, Math.min(1, sample));
      pcm[i] = clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff;
    }
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}
registerProcessor("eva-pcm-processor", PcmProcessor);
`;

type DictationSession = {
  mediaStream: MediaStream;
  audioContext: AudioContext;
  workletNode: AudioWorkletNode;
  sourceNode: MediaStreamAudioSourceNode;
  closeAudio: () => void;
};

function stopMediaTracks(mediaStream: MediaStream) {
  for (const track of mediaStream.getTracks()) {
    track.stop();
  }
}

type TranscriptHandlers = {
  isCurrent: () => boolean;
  onDelta: (delta: string) => void;
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onStreamError: () => void;
};

/**
 * Consumes the AI SDK transcription stream. Kept outside the hook's `try`
 * so React Compiler does not bail on `for await` / ternaries in try blocks.
 */
async function consumeTranscriptionStream(
  fullStream: AsyncIterable<{ type: string }>,
  handlers: TranscriptHandlers,
) {
  for await (const part of fullStream) {
    if (!handlers.isCurrent()) break;
    if (part.type === "transcript-delta") {
      if ("delta" in part && typeof part.delta === "string") {
        handlers.onDelta(part.delta);
      }
    } else if (part.type === "transcript-partial") {
      if ("text" in part && typeof part.text === "string") {
        handlers.onPartial(part.text);
      }
    } else if (part.type === "transcript-final") {
      if ("text" in part && typeof part.text === "string") {
        handlers.onFinal(part.text);
      }
    } else if (part.type === "error") {
      handlers.onStreamError();
      return;
    }
  }
}

/**
 * Live speech-to-text through AI Gateway streaming STT. Mints a short-lived
 * token from Convex, captures mic PCM, and pushes transcript updates via
 * `onText` (prefix + committed finals + pending deltas).
 */
export function useGatewayDictation(onText: (fullText: string) => void) {
  const mintToken = useAction(api.transcription.mintTranscriptionToken);
  const [status, setStatus] = useState<GatewayDictationStatus>("idle");
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const sessionRef = useRef<DictationSession | null>(null);
  const streamReaderCancelRef = useRef<(() => void) | null>(null);
  const generationRef = useRef(0);

  const cleanup = useCallback(() => {
    streamReaderCancelRef.current?.();
    streamReaderCancelRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      session.closeAudio();
    }
  }, []);

  // Mic + WebSocket session must stop when the composer unmounts.
  useEffect(() => {
    return () => {
      generationRef.current += 1;
      cleanup();
    };
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const start = useCallback(
    async (prefix: string) => {
      if (sessionRef.current) return;

      const generation = generationRef.current + 1;
      generationRef.current = generation;
      setStatus("connecting");

      const separator = prefix && !prefix.endsWith(" ") ? " " : "";
      const textPrefix = prefix + separator;
      let committed = "";
      let pending = "";

      const publish = () => {
        onTextRef.current(textPrefix + committed + pending);
      };

      try {
        const { token, modelId } = await mintToken({});
        if (generationRef.current !== generation) return;

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        if (generationRef.current !== generation) {
          stopMediaTracks(mediaStream);
          return;
        }

        const audioContext = new AudioContext();
        const blob = new Blob([PCM_WORKLET_SOURCE], {
          type: "application/javascript",
        });
        const workletUrl = URL.createObjectURL(blob);
        const addModule = audioContext.audioWorklet.addModule(workletUrl);
        // Revoke whether addModule succeeds or fails (avoid `finally` for React Compiler).
        void addModule.then(
          () => URL.revokeObjectURL(workletUrl),
          () => URL.revokeObjectURL(workletUrl),
        );
        await addModule;

        const sourceNode = audioContext.createMediaStreamSource(mediaStream);
        const workletNode = new AudioWorkletNode(
          audioContext,
          "eva-pcm-processor",
        );
        sourceNode.connect(workletNode);
        const mute = audioContext.createGain();
        mute.gain.value = 0;
        workletNode.connect(mute);
        mute.connect(audioContext.destination);

        let streamController: ReadableStreamDefaultController<Uint8Array> | null =
          null;

        const onPcmMessage = (event: MessageEvent<ArrayBuffer>) => {
          if (event.data.byteLength === 0) return;
          if (streamController === null) return;
          streamController.enqueue(new Uint8Array(event.data));
        };

        const audio = new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller;
            workletNode.port.addEventListener("message", onPcmMessage);
            // AudioWorklet ports need an explicit start when using addEventListener.
            workletNode.port.start();
          },
          cancel() {
            workletNode.port.removeEventListener("message", onPcmMessage);
          },
        });

        const abortController = new AbortController();

        const closeAudio = () => {
          abortController.abort();
          workletNode.port.removeEventListener("message", onPcmMessage);
          try {
            workletNode.disconnect();
          } catch {
            // already disconnected
          }
          try {
            sourceNode.disconnect();
          } catch {
            // already disconnected
          }
          stopMediaTracks(mediaStream);
          void audioContext.close();
          if (streamController) {
            try {
              streamController.close();
            } catch {
              // already closed
            }
            streamController = null;
          }
        };

        sessionRef.current = {
          mediaStream,
          audioContext,
          workletNode,
          sourceNode,
          closeAudio,
        };

        streamReaderCancelRef.current = () => {
          closeAudio();
        };

        const { experimental_streamTranscribe, createGateway } = await import(
          /* webpackChunkName: "gateway-dictation" */ "./gatewayDictationSdk"
        );

        if (generationRef.current !== generation) {
          cleanup();
          return;
        }

        // Browser uses the short-lived `vcst_` token as apiKey — never the
        // server Gateway credential. Model id must match the token scope.
        const clientGateway = createGateway({ apiKey: token });
        const result = experimental_streamTranscribe({
          model: clientGateway.transcription(modelId),
          audio,
          inputAudioFormat: { type: "audio/pcm", rate: TARGET_SAMPLE_RATE },
          abortSignal: abortController.signal,
        });

        setStatus("listening");

        void (async () => {
          try {
            await consumeTranscriptionStream(result.fullStream, {
              isCurrent: () => generationRef.current === generation,
              onDelta: (delta) => {
                pending += delta;
                publish();
              },
              onPartial: (text) => {
                pending = text;
                publish();
              },
              onFinal: (text) => {
                committed += text;
                pending = "";
                publish();
              },
              onStreamError: () => {
                console.error("[useGatewayDictation] stream error part");
                toast.error("Voice dictation stopped unexpectedly");
                cleanup();
                setStatus("error");
              },
            });
          } catch (error) {
            if (generationRef.current !== generation) return;
            if (abortController.signal.aborted) {
              cleanup();
              setStatus("idle");
              return;
            }
            console.error("[useGatewayDictation]", error);
            toast.error("Voice dictation stopped unexpectedly");
            cleanup();
            setStatus("error");
            return;
          }
          if (generationRef.current === generation) {
            cleanup();
            setStatus("idle");
          }
        })();
      } catch (error) {
        if (generationRef.current !== generation) return;
        console.error("[useGatewayDictation]", error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Could not start dictation");
        }
        cleanup();
        setStatus("error");
      }
    },
    [cleanup, mintToken],
  );

  const toggle = useCallback(
    (prefix: string) => {
      if (status === "listening" || status === "connecting") {
        stop();
        return;
      }
      void start(prefix);
    },
    [start, status, stop],
  );

  return {
    status,
    isListening: status === "listening" || status === "connecting",
    isConnecting: status === "connecting",
    start,
    stop,
    toggle,
  };
}

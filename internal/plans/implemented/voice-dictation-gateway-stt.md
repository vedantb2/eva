# Voice dictation (live streaming transcription) via AI Gateway

**Status:** implemented (2026-08-02) — Step 0 verified (`getToken` for `xai/grok-stt` OK)

## Context

Mic button in composers should transcribe speech **live**. Today's `PromptInputSpeech` is a no-op in `ChatComposer` (queries a missing textarea). Replace with AI Gateway streaming STT, gated by an experimental switch. Model is **hardcoded** server-side (`xai/grok-stt`) — no user model picker.

## Decisions

| Decision  | Choice                                                  |
| --------- | ------------------------------------------------------- |
| Streaming | `experimental_streamTranscribe` + PCM 24 kHz            |
| Model     | Hardcoded `xai/grok-stt` in `transcription.ts`          |
| Setting   | Switch only (`voiceDictationEnabled`)                   |
| Flag ON   | Gateway mic in ChatComposer + QuickTaskModal            |
| Flag OFF  | Web Speech via `setInput` in ChatComposer; no modal mic |

## Implementation map

- `userFields.voiceDictationEnabled` + auth get/set
- `transcription.mintTranscriptionToken` (`"use node"`) — auth + flag gate + `getToken`
- `useGatewayDictation` + `gatewayDictationSdk` (dynamic import of `ai` / `@ai-sdk/gateway`)
- `ComposerSpeechButton` swaps gateway vs web-speech
- Experimental settings Switch
- Deps: backend `@ai-sdk/gateway`; web `ai@^7` + `@ai-sdk/gateway`

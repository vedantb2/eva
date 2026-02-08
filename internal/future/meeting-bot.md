# AI Meeting Bot — Teams + Company Knowledge

## Overview

An AI meeting participant ("Eva") that knows everything in SharePoint/Teams and can join meetings, listen, detect questions, and speak answers.

---

## Part 1 — AI with Company Knowledge (SharePoint/Teams)

### How it works: Microsoft Graph API + RAG

1. **App registration in Azure AD**
   - Create an app (the "Eva" AI identity)
   - Grant permissions:
     - `Files.Read.All`
     - `Sites.Read.All`
     - `Group.Read.All`
     - `ChannelMessage.Read.All` (optional)

2. **Index company knowledge**
   - Crawl SharePoint + Teams files
   - Chunk documents
   - Store embeddings in a vector DB (e.g. Supabase pgvector)

3. **At runtime**
   - User asks question
   - AI searches company documents via vector similarity
   - Feeds relevant chunks into LLM
   - Answers with company context

This is how Microsoft 365 Copilot works under the hood.

---

## Part 2 — AI Joins a Teams Call

Uses the **Microsoft Graph Communications API** (Cloud Communications / Calling & Meeting Bots).

The bot:

1. Gets invited to the meeting (like a user)
2. Joins as **Eva (AI Assistant)**
3. Stays muted
4. Receives meeting audio stream
5. Runs speech-to-text
6. Runs LLM analysis
7. Speaks back using TTS

---

## Part 3 — Real-time Question Detection + Response

### Pipeline

```
Teams Meeting Audio
        ↓
Bot receives audio stream
        ↓
Speech-to-text (Azure Speech / Whisper)
        ↓
Real-time transcript stream
        ↓
LLM analyzes:
  - Is this a question?
  - Is it directed at Eva?
  - Does company knowledge help?
        ↓
If yes → signal to meeting
```

### "Raising hand" options

- Send meeting chat message: "I can help answer that."
- Play a short sound + speak: "I have an answer if you'd like."
- Use reaction APIs (limited)

### "Say yes Eva" flow

- Bot hears "Yes Eva"
- Confidence check
- Unmutes
- Sends TTS audio back into meeting

---

## Full Architecture

```
             ┌─────────────────────────┐
             │  Teams Meeting Audio    │
             └─────────────┬───────────┘
                           ↓
                  Teams Calling Bot
                           ↓
                   Speech-to-Text
                           ↓
                    Real-time LLM
                   (question detection)
                           ↓
          ┌────────────────┴────────────────┐
          ↓                                 ↓
   Company Knowledge RAG           General reasoning
 (SharePoint/Teams indexing)
          ↓
        Answer
          ↓
      Text-to-Speech
          ↓
   Audio streamed back into Teams
```

---

## Compliance Requirements

The AI is recording conversation and processing employee speech, which triggers:

- GDPR
- Employee monitoring rules
- IT security approval
- Legal approval

Required:

- Meeting notice ("AI assistant present")
- Data retention policy
- Permission scoping

---

## Tech Stack

| Layer             | Tech                               |
| ----------------- | ---------------------------------- |
| Teams meeting bot | Microsoft Graph Communications API |
| Speech-to-text    | Azure Speech or Whisper            |
| LLM brain         | OpenAI / Azure OpenAI              |
| Company knowledge | Graph API → Supabase pgvector      |
| Voice output      | Azure Neural TTS                   |
| Backend           | Node.js                            |

---

## Difficulty Ratings

| Feature                      | Difficulty       |
| ---------------------------- | ---------------- |
| AI that knows SharePoint     | Medium           |
| AI that joins meeting        | Hard             |
| Real-time question detection | Medium           |
| AI speaking in meeting       | Hard             |
| Production-ready compliance  | Enterprise-level |

---

## Notes

- This is a standalone project — no overlap with Conductor codebase
- Essentially building a custom Microsoft Copilot for Meetings
- Startup-grade product, not a weekend project
- Foundation step: create a bot that can join a Teams meeting and receive audio

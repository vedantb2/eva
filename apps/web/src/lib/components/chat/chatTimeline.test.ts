import { describe, expect, test } from "vitest";
import { ChatTimelineProjector, type TimelineMessage } from "./chatTimeline";

function message(
  id: string,
  role: TimelineMessage["role"],
  content: string,
  turnId: string | undefined,
): TimelineMessage {
  return {
    _id: id,
    _creationTime: Number(id.replace(/\D/g, "")) || 1,
    parentId: "session",
    role,
    content,
    timestamp: Number(id.replace(/\D/g, "")) || 1,
    media: undefined,
    attachmentUrls: undefined,
    attachments: undefined,
    ...(turnId ? { turnId } : {}),
  };
}

describe("ChatTimelineProjector", () => {
  test("pairs exact turns across system alerts and builds one jump anchor", () => {
    const user = message("m1", "user", "Build it", "turn-1");
    const alert = {
      ...message("m2", "assistant", "Published", undefined),
      isSystemAlert: true,
    };
    const assistant = message("m3", "assistant", "Done", "turn-1");
    const result = new ChatTimelineProjector<TimelineMessage>().project({
      messages: [user, alert, assistant],
    });

    const assistantRow = result.rows[2];
    expect(assistantRow?.kind).toBe("message");
    if (assistantRow?.kind !== "message") {
      throw new Error("Expected an assistant message row");
    }
    expect(assistantRow.precedingUser).toBe(user);
    expect(result.jumpAnchors).toEqual([
      {
        id: "turn:turn-1:user",
        rowIndex: 0,
        content: "Build it",
        reply: "Done",
      },
    ]);
  });

  test("binds stream and question only to the exact active assistant attempt", () => {
    const user = message("m1", "user", "Build it", "turn-1");
    const assistant = message("m2", "assistant", "", "turn-1");
    const activeTurn = {
      turnId: "turn-1",
      assistantMessageId: "m2",
      attempt: 2,
      acceptedAt: 1,
    };
    const stream = {
      currentActivity: "Working",
      currentContent: "Now",
      pendingQuestion: undefined,
      turnId: "turn-1",
      assistantMessageId: "m2",
      attempt: 2,
    };
    const question = {
      questionId: "question-1",
      toolUseId: "tool-1",
      payload: '{"questions":[]}',
      turnId: "turn-1",
      assistantMessageId: "m2",
      attempt: 2,
    };
    const projector = new ChatTimelineProjector<TimelineMessage>();
    const exact = projector.project({
      messages: [user, assistant],
      activeTurn,
      streaming: stream,
      activeQuestion: question,
    });
    const exactAssistant = exact.rows[1];
    expect(exactAssistant?.kind).toBe("message");
    if (exactAssistant?.kind !== "message") {
      throw new Error("Expected an exact assistant row");
    }
    expect(exactAssistant.stream).toBe(stream);
    expect(exactAssistant.question).toBe(question);

    const stale = projector.project({
      messages: [user, assistant],
      activeTurn,
      streaming: { ...stream, attempt: 1 },
      activeQuestion: { ...question, assistantMessageId: "older" },
    });
    const staleAssistant = stale.rows[1];
    expect(staleAssistant?.kind).toBe("message");
    if (staleAssistant?.kind !== "message") {
      throw new Error("Expected a stale assistant row");
    }
    expect(staleAssistant.stream).toBeUndefined();
    expect(staleAssistant.question).toBeUndefined();
  });

  test("keeps the logical key when Convex reconciles an optimistic message", () => {
    const projector = new ChatTimelineProjector<TimelineMessage>();
    const optimistic = projector.project({
      messages: [message("turn:turn-1:user", "user", "Build it", "turn-1")],
    });
    expect(optimistic.rows.map((row) => row.id)).toEqual(["turn:turn-1:user"]);

    const canonical = projector.project({
      messages: [
        message("m1", "user", "Build it", "turn-1"),
        message("m2", "assistant", "", "turn-1"),
      ],
    });
    expect(canonical.rows.map((row) => row.id)).toEqual([
      "turn:turn-1:user",
      "turn:turn-1:assistant",
    ]);
  });

  test("reuses completed rows while replacing only the streaming row", () => {
    const messages = [
      message("m1", "user", "First", "turn-1"),
      message("m2", "assistant", "Done", "turn-1"),
      message("m3", "user", "Second", "turn-2"),
      message("m4", "assistant", "", "turn-2"),
    ];
    const activeTurn = {
      turnId: "turn-2",
      assistantMessageId: "m4",
      attempt: 1,
      acceptedAt: 1,
    };
    const projector = new ChatTimelineProjector<TimelineMessage>();
    const first = projector.project({
      messages,
      activeTurn,
      streaming: {
        currentActivity: "Working",
        currentContent: "A",
        pendingQuestion: undefined,
        turnId: "turn-2",
        assistantMessageId: "m4",
        attempt: 1,
      },
    });
    const second = projector.project({
      messages,
      activeTurn,
      streaming: {
        currentActivity: "Working",
        currentContent: "AB",
        pendingQuestion: undefined,
        turnId: "turn-2",
        assistantMessageId: "m4",
        attempt: 1,
      },
    });

    expect(second.rows[0]).toBe(first.rows[0]);
    expect(second.rows[1]).toBe(first.rows[1]);
    expect(second.rows[2]).toBe(first.rows[2]);
    expect(second.rows[3]).not.toBe(first.rows[3]);
  });

  test("visits a 10,000-message history exactly once", () => {
    const messages: TimelineMessage[] = [];
    for (let index = 0; index < 5000; index++) {
      const turnId = `turn-${index}`;
      messages.push(message(`u${index}`, "user", `User ${index}`, turnId));
      messages.push(
        message(`a${index}`, "assistant", `Reply ${index}`, turnId),
      );
    }
    const result = new ChatTimelineProjector<TimelineMessage>().project({
      messages,
    });
    expect(result.visitedMessages).toBe(10_000);
    expect(result.rows).toHaveLength(10_000);
    expect(result.jumpAnchors).toHaveLength(5000);
  });
});

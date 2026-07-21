import { test, expect } from "vitest";
import {
  ESCALATION_SENTINEL,
  isEscalationReply,
  shouldHoldConversationalStream,
} from "../providers/conversationalEscalation";

test("isEscalationReply matches exact sentinel", () => {
  expect(isEscalationReply(ESCALATION_SENTINEL)).toBe(true);
  expect(isEscalationReply(`  ${ESCALATION_SENTINEL}`)).toBe(true);
  expect(isEscalationReply(`${ESCALATION_SENTINEL}\n`)).toBe(true);
});

test("isEscalationReply rejects normal replies", () => {
  expect(isEscalationReply("hi")).toBe(false);
  expect(isEscalationReply("Hello — how can I help?")).toBe(false);
  expect(isEscalationReply("")).toBe(false);
});

test("shouldHoldConversationalStream holds prefixes and full sentinel", () => {
  expect(shouldHoldConversationalStream("")).toBe(true);
  expect(shouldHoldConversationalStream("<")).toBe(true);
  expect(shouldHoldConversationalStream("<<EVA")).toBe(true);
  expect(shouldHoldConversationalStream(ESCALATION_SENTINEL)).toBe(true);
  expect(shouldHoldConversationalStream(`${ESCALATION_SENTINEL} `)).toBe(true);
});

test("shouldHoldConversationalStream releases on divergent replies", () => {
  expect(shouldHoldConversationalStream("hi")).toBe(false);
  expect(shouldHoldConversationalStream("Hello")).toBe(false);
  expect(shouldHoldConversationalStream("<not-escalate")).toBe(false);
});

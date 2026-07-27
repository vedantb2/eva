import { expect, test } from "vitest";
import { parseEditorChipSegments, parseSegments } from "./mentionEditorUtils";

// The composer pattern lists the link source first so a full URL is consumed as
// one match before an `@`/`/` label could match a fragment inside it. Without
// that ordering, the `/design` segment of a Figma URL is mis-parsed as a skill
// chip, breaking the pasted link. This is the regression the ordering guards.
test("parseEditorChipSegments keeps a provider URL whole despite an inner skill token", () => {
  const url = "https://www.figma.com/design/KEY/My-File";
  const segments = parseEditorChipSegments(url, [], ["design"]);
  expect(segments).toEqual([{ type: "link", value: url }]);
});

test("parseEditorChipSegments splits text, mentions, skills, and links in order", () => {
  const segments = parseEditorChipSegments(
    "hi @alice run /deploy see https://github.com/owner/repo now",
    ["alice"],
    ["deploy"],
  );
  expect(segments).toEqual([
    { type: "text", value: "hi " },
    { type: "mention", value: "@alice" },
    { type: "text", value: " run " },
    { type: "skill", value: "/deploy" },
    { type: "text", value: " see " },
    { type: "link", value: "https://github.com/owner/repo" },
    { type: "text", value: " now" },
  ]);
});

test("parseSegments returns a single text segment when no labels are known", () => {
  expect(parseSegments("@alice hello", [])).toEqual([
    { type: "text", value: "@alice hello" },
  ]);
});

test("parseSegments prefers the longest matching label so prefixes do not win", () => {
  // "foobar" must win over "foo" — the fix that sorts labels longest-first.
  const segments = parseSegments("hey @foobar!", ["foo", "foobar"]);
  expect(segments).toEqual([
    { type: "text", value: "hey " },
    { type: "mention", value: "@foobar" },
    { type: "text", value: "!" },
  ]);
});

test("parseSegments escapes regex-special characters in labels", () => {
  // A label with regex metacharacters must match literally, not as a pattern.
  const segments = parseSegments("ping @a.b(c)", ["a.b(c)"]);
  expect(segments).toEqual([
    { type: "text", value: "ping " },
    { type: "mention", value: "@a.b(c)" },
  ]);
});

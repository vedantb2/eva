import type { Id } from "@eva/backend";
import type { MentionItem } from "./MentionEditor";

/**
 * Merges teammate and data `@` mention candidates into one alphabetical picker
 * list, and returns the set of ids that belong to people.
 *
 * Callers need that set because people and data tokens are byte-identical
 * (`@[Label](convexId)`), so on the client the id is the only way to tell them
 * apart — a chip click should navigate for data but do nothing for a person,
 * and each kind gets a different hover card.
 */
export function mergeMentionItems(
  peopleItems: MentionItem<Id<"users">>[],
  dataItems: MentionItem[],
): { items: MentionItem[]; peopleIds: ReadonlySet<string> } {
  const items: MentionItem[] = [...peopleItems, ...dataItems].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  return { items, peopleIds: new Set(peopleItems.map((person) => person.id)) };
}

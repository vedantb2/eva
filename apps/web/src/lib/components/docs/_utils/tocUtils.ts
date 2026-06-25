import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const TOC_HEADING_SELECTOR = "h1, h2, h3";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildTocItems(
  headings: ReadonlyArray<{ text: string; level: number }>,
): TocItem[] {
  const seen = new Map<string, number>();
  return headings.map(({ text, level }) => {
    const base = slugify(text) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    return { id, text, level };
  });
}

/** Scan rendered headings, assign stable ids, and return the TOC list. */
export function assignHeadingIds(
  container: HTMLElement,
  selector = TOC_HEADING_SELECTOR,
): TocItem[] {
  const headings = Array.from(
    container.querySelectorAll<HTMLHeadingElement>(selector),
  );
  const items = buildTocItems(
    headings.map((el) => ({
      text: el.textContent?.trim() ?? "",
      level: Number(el.tagName.slice(1)),
    })),
  );
  for (let i = 0; i < items.length; i++) {
    const heading = headings[i];
    if (heading) heading.id = items[i].id;
  }
  return items;
}

function headingLevel(node: ProseMirrorNode): number | null {
  if (node.type.name !== "heading") return null;
  const level = node.attrs.level;
  return typeof level === "number" ? level : null;
}

/** Heading section the cursor sits in (last heading at or above `pos`). */
export function activeTocIdAtPosition(
  doc: ProseMirrorNode,
  pos: number,
): string | null {
  const collected: Array<{ text: string; level: number }> = [];
  let activeIndex = -1;

  doc.descendants((node, nodePos) => {
    const level = headingLevel(node);
    if (level === null) return;
    const index = collected.length;
    collected.push({ text: node.textContent, level });
    if (nodePos <= pos) {
      activeIndex = index;
    }
  });

  if (activeIndex < 0) return null;
  const items = buildTocItems(collected);
  return items[activeIndex]?.id ?? null;
}

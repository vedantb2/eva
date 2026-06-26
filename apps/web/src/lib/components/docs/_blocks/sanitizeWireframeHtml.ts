const ALLOWED_TAGS = new Set([
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "button",
  "input",
  "label",
  "ul",
  "ol",
  "li",
  "img",
  "a",
  "header",
  "footer",
  "section",
  "nav",
  "main",
  "form",
  "textarea",
  "select",
  "option",
]);

const ALLOWED_ATTRS = new Set([
  "class",
  "href",
  "src",
  "alt",
  "type",
  "placeholder",
  "value",
  "aria-label",
  "role",
  "disabled",
  "readonly",
]);

const GLOBAL_ATTR_PREFIXES = ["data-", "aria-"];

function isAllowedAttr(name: string): boolean {
  if (ALLOWED_ATTRS.has(name)) return true;
  return GLOBAL_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/** Minimal allowlist HTML sanitizer for wireframe/diagram HTML blocks. */
export function sanitizeWireframeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  sanitizeNode(template.content);
  const wrapper = document.createElement("div");
  wrapper.appendChild(template.content.cloneNode(true));
  return wrapper.innerHTML;
}

function sanitizeNode(parent: ParentNode): void {
  const children = [...parent.childNodes];
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      continue;
    }
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      el.remove();
      continue;
    }
    for (const attr of [...el.attributes]) {
      if (!isAllowedAttr(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
      }
    }
  }
}

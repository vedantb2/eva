/**
 * Renders stored HTML (a PR-recap walkthrough or a doc's HTML field) in a
 * sandboxed iframe. `allow-scripts` WITHOUT `allow-same-origin` runs the page in
 * an opaque origin: its inline JS works, but it cannot reach eva's cookies,
 * storage, or DOM. The HTML must be fully self-contained (no external URLs).
 */
export function HtmlPreviewFrame({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  return (
    <iframe
      title={title}
      srcDoc={html}
      sandbox="allow-scripts"
      className="h-full w-full rounded-surface border border-border bg-white"
    />
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { BlockProps } from "../types";
import { sanitizeWireframeHtml } from "../sanitizeWireframeHtml";

const plugins = { cjk, math, mermaid };

export function DiagramBlock({
  data,
  readOnly,
  onChange,
}: BlockProps<"diagram">) {
  if (data.kind === "mermaid") {
    return (
      <MermaidDiagram
        source={data.source ?? ""}
        readOnly={readOnly}
        onChange={(source) => onChange({ ...data, kind: "mermaid", source })}
      />
    );
  }

  return (
    <HtmlDiagram
      html={data.html ?? ""}
      css={data.css}
      readOnly={readOnly}
      onChange={(html) => onChange({ ...data, kind: "html", html })}
    />
  );
}

function MermaidDiagram({
  source,
  readOnly,
  onChange,
}: {
  source: string;
  readOnly: boolean;
  onChange: (source: string) => void;
}) {
  if (readOnly) {
    return (
      <div className="rounded-surface border border-border p-3">
        <Streamdown
          plugins={plugins}
        >{`\`\`\`mermaid\n${source}\n\`\`\``}</Streamdown>
      </div>
    );
  }

  return (
    <div className="rounded-surface border border-border p-3">
      <label className="text-xs text-muted-foreground">
        Mermaid source
        <textarea
          className="mt-1 min-h-32 w-full rounded-surface border border-border bg-background px-2 py-1 font-mono text-xs"
          value={source}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}

function HtmlDiagram({
  html,
  css,
  readOnly,
  onChange,
}: {
  html: string;
  css?: string;
  readOnly: boolean;
  onChange: (html: string) => void;
}) {
  const styleId = useId().replace(/:/g, "");
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!css) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      style.remove();
      styleRef.current = null;
    };
  }, [css, styleId]);

  if (readOnly) {
    return (
      <div
        className="eva-wireframe rounded-surface border border-border p-3"
        dangerouslySetInnerHTML={{ __html: sanitizeWireframeHtml(html) }}
      />
    );
  }

  return (
    <div className="rounded-surface border border-border p-3">
      <label className="text-xs text-muted-foreground">
        HTML
        <textarea
          className="mt-1 min-h-32 w-full rounded-surface border border-border bg-background px-2 py-1 font-mono text-xs"
          value={html}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}

import { useRef } from "react";
import { buildArtifactSrcDoc } from "./_shim";
import { useArtifactBridge } from "./useArtifactBridge";

/** Renders a hosted artifact in a sandboxed iframe with the cowork bridge wired up. */
export function ArtifactFrame({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useArtifactBridge(iframeRef);
  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={buildArtifactSrcDoc(html)}
      // allow-scripts WITHOUT allow-same-origin: the artifact runs in an opaque
      // origin and cannot reach eva's cookies, storage, or DOM. CDN scripts and
      // postMessage still work.
      sandbox="allow-scripts"
      className="h-full w-full border-0 bg-white"
    />
  );
}

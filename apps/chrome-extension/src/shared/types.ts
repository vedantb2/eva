export interface ReactComponentNode {
  name: string;
  type: "component" | "element" | "fragment" | "text";
  props: Record<string, unknown>;
  state: Record<string, unknown> | null;
  hooks: HookInfo[];
  children: ReactComponentNode[];
  depth: number;
  key: string | null;
}

export interface HookInfo {
  type: string;
  value: unknown;
}

export interface ElementInfo {
  tagName: string;
  id: string;
  classNames: string[];
  textContent: string;
  attributes: Record<string, string>;
  boundingRect: { top: number; left: number; width: number; height: number };
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontFamily: string;
  };
  selector: string;
  innerHTML: string;
  outerHTML: string;
}

export interface ExtractedContext {
  element: ElementInfo;
  react: ReactComponentNode | null;
  selectedText?: string;
  metadata: {
    capturedAt: number;
    sourceUrl: string;
    hasReact: boolean;
    totalComponents: number;
    reactVersion: string;
  };
}

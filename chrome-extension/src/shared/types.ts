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
  metadata: {
    capturedAt: number;
    sourceUrl: string;
    hasReact: boolean;
    totalComponents: number;
    reactVersion: string;
  };
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface RepoInfo {
  _id: string;
  owner: string;
  name: string;
  installationId: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserInfo | null;
}

export interface ExtensionSettings {
  defaultRepoId: string | null;
  conductorUrl: string;
}

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SessionInfo {
  id: string;
  repoId: string;
  messages: SessionMessage[];
}

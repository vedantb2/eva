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

export interface ExtractionMetadata {
  reactVersion: string;
  totalComponents: number;
  capturedAt: number;
  sourceUrl: string;
  elementSelector: string;
}

export interface ExtractedContext {
  tree: ReactComponentNode;
  metadata: ExtractionMetadata;
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

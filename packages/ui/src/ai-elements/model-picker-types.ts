export interface ModelOption<TModel extends string = string> {
  id: TModel;
  provider: string;
  label: string;
}

/** A user's own provider account, surfaced as a selectable group in the picker. */
export interface ModelAccount {
  id: string;
  provider: string;
  label: string;
  accentColor?: string;
}

export function getProviderLabel(provider: string): string {
  switch (provider) {
    case "claude":
      return "Claude";
    case "codex":
      return "Codex";
    case "opencode":
      return "Opencode";
    case "cursor":
      return "Cursor";
    default:
      return provider;
  }
}

export function findModelOption<TModel extends string>(
  value: TModel,
  options: ReadonlyArray<ModelOption<TModel>>,
): ModelOption<TModel> | null {
  const option = options.find((entry) => entry.id === value);
  return option ?? options[0] ?? null;
}

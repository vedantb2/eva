interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
}

interface ParsedSpec {
  title: string;
  description: string;
  tasks: ParsedTask[];
}

export function parseSpec(specJson: string): ParsedSpec {
  const parsed = JSON.parse(specJson);
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    tasks: (parsed.tasks ?? []).map(
      (t: {
        title?: string;
        description?: string;
        dependencies?: number[];
      }) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        dependencies: t.dependencies ?? [],
      }),
    ),
  };
}

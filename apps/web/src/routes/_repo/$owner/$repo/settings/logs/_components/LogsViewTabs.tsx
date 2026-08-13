import { Tabs, TabsList, TabsTrigger } from "@eva/ui";

type LogView = "type" | "project";

interface LogsViewTabsProps {
  value: LogView;
  onChange: (value: LogView) => void;
}

/** Type / Project segmented control for the logs toolbar. */
export function LogsViewTabs({ value, onChange }: LogsViewTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === "type" || next === "project") onChange(next);
      }}
    >
      <TabsList className="tabs-segmented h-8">
        <TabsTrigger value="type" className="px-3 text-xs">
          Type
        </TabsTrigger>
        <TabsTrigger value="project" className="px-3 text-xs">
          Project
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

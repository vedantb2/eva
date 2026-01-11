"use client";

type ViewType = "all" | "blood-pressure" | "glucose";

const TABS: { id: ViewType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blood-pressure", label: "Blood Pressure" },
  { id: "glucose", label: "Glucose" },
];

interface PillTabsProps {
  selectedView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function PillTabs({ selectedView, onViewChange }: PillTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            selectedView === tab.id
              ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
              : "text-neutral-600 dark:text-neutral-400"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

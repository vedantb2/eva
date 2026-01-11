"use client";

interface Festival {
  name: string;
  nameMarathi: string;
  description: string;
  gregorianDateStart: string;
  icon: string;
}

interface FestivalListProps {
  festivals: Festival[] | undefined;
}

export function FestivalList({ festivals }: FestivalListProps) {
  if (!festivals || festivals.length === 0) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
        No festivals this month
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {festivals.map((festival) => (
        <div
          key={festival.name}
          className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50"
        >
          <span className="text-2xl">{festival.icon}</span>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {festival.name}
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              {festival.nameMarathi}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {new Date(festival.gregorianDateStart).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

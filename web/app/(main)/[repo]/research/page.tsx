import { IconBrain } from "@tabler/icons-react";

export default function ResearchPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <IconBrain className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
        <p className="text-neutral-500 dark:text-neutral-400">
          Select a query or create a new one to get started
        </p>
      </div>
    </div>
  );
}

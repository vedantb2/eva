import { IconBrain } from "@tabler/icons-react";

export default function ResearchPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <IconBrain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Select a query or create a new one to get started
        </p>
      </div>
    </div>
  );
}

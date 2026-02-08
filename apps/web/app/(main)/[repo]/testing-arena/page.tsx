import { IconFileText } from "@tabler/icons-react";

export default function TestingArenaPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
      <IconFileText size={48} className="mb-3" />
      <p>Select a document to test</p>
    </div>
  );
}

import { IconTerminal2 } from "@tabler/icons-react";

export default function SessionsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <IconTerminal2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          Select a session to view the conversation
        </p>
      </div>
    </div>
  );
}

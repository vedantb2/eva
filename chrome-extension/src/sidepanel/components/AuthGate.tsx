import { Button } from "@/components/ui/button";
import { LogIn, Zap } from "lucide-react";

interface AuthGateProps {
  onLogin: () => void;
}

export function AuthGate({ onLogin }: AuthGateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6">
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-12 h-12 text-primary" />
        <span className="text-2xl font-bold">Eva Assist</span>
      </div>

      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        AI-powered assistant for asking questions and flagging issues in your
        codebase.
      </p>

      <Button onClick={onLogin} size="lg" className="gap-2">
        <LogIn className="w-5 h-5" />
        Sign in with Eva
      </Button>

      <p className="text-muted-foreground text-sm mt-6 text-center">
        You&apos;ll be redirected to sign in
      </p>
    </div>
  );
}

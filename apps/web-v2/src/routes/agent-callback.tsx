import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useSignIn } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

const validateSearch = (search: Record<string, string>) => ({
  ticket: typeof search.ticket === "string" ? search.ticket : "",
});

export const Route = createFileRoute("/agent-callback")({
  validateSearch,
  component: AgentCallback,
});

function AgentCallback() {
  const { signIn, setActive } = useSignIn();
  const { ticket } = useSearch({ from: "/agent-callback" });
  const navigate = useNavigate();
  const consumed = useRef(false);

  useEffect(() => {
    if (!ticket || !signIn || consumed.current) return;
    consumed.current = true;

    signIn
      .create({ strategy: "ticket", ticket })
      .then((result) => {
        if (result.createdSessionId) {
          return setActive({ session: result.createdSessionId }).then(() => {
            navigate({ to: "/home", replace: true });
          });
        }
      })
      .catch((err: Error) => {
        console.error("Agent sign-in failed:", err);
      });
  }, [signIn, setActive, ticket, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}

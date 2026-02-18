import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { TooltipProvider } from "@conductor/ui";
import { ConvexProvider } from "./providers/ConvexProvider";
import { AppRouter } from "./router";
import { SignInScreen } from "./components/auth/SignInScreen";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProvider>
        <TooltipProvider delayDuration={300}>
          <div className="dark h-screen flex flex-col">
            <SignedOut>
              <SignInScreen />
            </SignedOut>
            <SignedIn>
              <AppRouter />
            </SignedIn>
          </div>
        </TooltipProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}

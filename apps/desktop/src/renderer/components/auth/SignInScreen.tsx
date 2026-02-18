import { SignIn } from "@clerk/clerk-react";

export function SignInScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <SignIn routing="hash" />
    </div>
  );
}

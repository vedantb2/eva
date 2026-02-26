import Image from "next/image";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@conductor/ui";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/icon.png"
            alt="Eva"
            width={80}
            height={80}
            className="rounded-2xl"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Eva
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Your AI Coworker
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <SignInButton mode="modal">
            <Button size="lg" variant="default">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="lg" variant="outline">
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}

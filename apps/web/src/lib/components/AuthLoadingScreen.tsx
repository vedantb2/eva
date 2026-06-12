import { LogoMark } from "@/lib/components/LogoMark";

/**
 * Neutral full-screen placeholder while auth state is unknown.
 * Must not resemble the signed-in app shell — visitors who bounce to
 * login/landing should never briefly see sidebar/content chrome.
 */
export function AuthLoadingScreen() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-background"
      aria-busy="true"
      aria-label="Loading"
    >
      <LogoMark size={32} className="animate-pulse text-primary" />
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@eva/ui";

/**
 * Renders a repo's uploaded logo image when present, otherwise the page's
 * existing fallback icon. Kept presentational so both the home and team repo
 * cards render the logo identically.
 */
export function RepoLogo({
  logoUrl,
  fallback,
  size = 28,
  className,
}: {
  logoUrl?: string | null;
  fallback: ReactNode;
  size?: number;
  className?: string;
}) {
  if (!logoUrl) return <>{fallback}</>;
  return (
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className={cn(
        "rounded-control shrink-0 border border-border object-cover",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

import type { ReactNode } from "react";

/**
 * Renders a repo's uploaded logo image when present, otherwise the page's
 * existing fallback icon. Kept presentational so both the home and team repo
 * cards render the logo identically.
 */
export function RepoLogo({
  logoUrl,
  fallback,
  size = 20,
}: {
  logoUrl?: string | null;
  fallback: ReactNode;
  size?: number;
}) {
  if (!logoUrl) return <>{fallback}</>;
  return (
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md border border-border object-cover"
      style={{ width: size, height: size }}
    />
  );
}

import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type DynamicLinkProps = Omit<ComponentProps<typeof Link>, "to"> & {
  to: string;
};

/**
 * Link wrapper for dynamically constructed paths (e.g. `${basePath}/quick-tasks`)
 * that can't satisfy TanStack Router's strict route-tree typing.
 * Prefer the typed <Link to="/$owner/$repo/..." params={...}> when possible.
 */
export function DynamicLink(props: DynamicLinkProps) {
  return <Link {...props} />;
}

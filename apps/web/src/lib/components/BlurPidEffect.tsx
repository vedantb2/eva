import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@eva/backend";

/**
 * Mirrors the user's blur-PID preference onto `<html data-blur-pid>`.
 *
 * A single global CSS rule in globals.css blurs every `[data-pii]` element under
 * that attribute, so the preference reaches names and emails rendered inside
 * portals (tooltips, popovers, hover cards) without threading a prop through
 * every call site. Renders nothing.
 */
export function BlurPidEffect() {
  const flags = useQuery(api.auth.getExperimentalFlags);
  const enabled = flags?.blurPid === true;

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.setAttribute("data-blur-pid", "");
    } else {
      root.removeAttribute("data-blur-pid");
    }
  }, [enabled]);

  return null;
}

"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Thin wrapper around sonner's Toaster. Theme-agnostic: the consuming app
 * passes `theme` (and any other ToasterProps) since the theme lives in the
 * app, not this package. Toasts are styled as border-based surfaces to match
 * the HeroUI design system (card surface + hairline border + overlay shadow).
 *
 * Sonner's default CSS hardcodes a system font stack on `[data-sonner-toast]`,
 * which beats inheritance from `body`. `fontFamily: inherit` wins that fight
 * so toasts follow `--font-sans` like the rest of the app (including the
 * sticky "Update available" refresh toast).
 */
function Toaster({ style, ...props }: ToasterProps) {
  return (
    <SonnerToaster
      style={{ fontFamily: "inherit", ...style }}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans rounded-surface border border-border bg-card text-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
export { toast } from "sonner";

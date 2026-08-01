import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Thin wrapper around sonner's Toaster. Theme-agnostic: the consuming app
 * passes `theme` (and any other ToasterProps) since the theme lives in the
 * app, not this package. Toasts are styled as border-based surfaces to match
 * the HeroUI design system (card surface + hairline border + overlay shadow).
 */
function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-surface bg-card text-foreground smooth-shadow-ring-lg",
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

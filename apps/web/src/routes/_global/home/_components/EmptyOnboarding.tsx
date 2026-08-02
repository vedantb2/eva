import { m } from "motion/react";
import { Button } from "@eva/ui";
import { IconBrandGithub } from "@tabler/icons-react";
import { PLATFORM_SECTIONS } from "@/lib/content/platformSections";

export function EmptyOnboarding({ connectUrl }: { connectUrl: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <IconBrandGithub size={24} />
      </div>
      <h2 className="text-balance text-base font-semibold tracking-[-0.01em] text-foreground">
        Connect your GitHub
      </h2>
      <p className="mt-2 max-w-sm text-pretty text-sm text-muted-foreground">
        Link a repo to plan, code, and ship with Eva.
      </p>
      <Button asChild size="sm" className="mt-6">
        <a href={connectUrl}>
          <IconBrandGithub size={16} />
          Connect GitHub
        </a>
      </Button>
      <ul className="mt-10 w-full space-y-2 text-left">
        {PLATFORM_SECTIONS.map((section) => (
          <li
            key={section.label}
            className="flex items-start gap-2.5 rounded-surface border border-border bg-card px-3 py-2.5"
          >
            <section.icon
              size={16}
              className="mt-0.5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {section.label}
              </p>
              <p className="text-xs text-muted-foreground">{section.shortDesc}</p>
            </div>
          </li>
        ))}
      </ul>
    </m.div>
  );
}

import { PLATFORM_SECTIONS } from "@/lib/content/platformSections";

export function WelcomeSetupIntroStep() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Connect GitHub, run sandboxes, and ship via tasks, sessions, and PRs.
      </p>
      <ul className="space-y-2">
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
      <p className="text-xs text-muted-foreground">
        We&apos;ll personalize Eva first, then you pick a codebase from home.
      </p>
    </div>
  );
}

import { PLATFORM_SECTIONS } from "@/lib/content/platformSections";

export function WelcomeSetupIntroStep() {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Eva connects to your GitHub codebases, runs code in remote sandboxes,
        and ships work through tasks, sessions, and pull requests — all from one
        platform.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PLATFORM_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="flex flex-col gap-2 rounded-surface bg-muted/40 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <section.icon size={14} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {section.label}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {section.longDesc}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Pick a codebase from home to get started — we&apos;ll help you
        personalize Eva first.
      </p>
    </div>
  );
}

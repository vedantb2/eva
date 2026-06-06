import { cn } from "@conductor/ui";
import { LANDING_PLATFORM_SECTIONS } from "./landingTaskDetailFixtures";

export function LandingCapabilityGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
      {LANDING_PLATFORM_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <div
            key={section.label}
            className={cn(
              "group rounded-surface bg-muted/40 p-3 transition-[background-color,transform] sm:p-3.5",
              "hover:bg-muted/55",
            )}
          >
            <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-[background-color] group-hover:bg-primary/15">
              <Icon size={15} className="text-primary" aria-hidden />
            </div>
            <p className="text-xs font-medium text-foreground">
              {section.label}
            </p>
            <p className="mt-0.5 hidden text-[10px] leading-snug text-muted-foreground sm:block">
              {section.shortDesc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

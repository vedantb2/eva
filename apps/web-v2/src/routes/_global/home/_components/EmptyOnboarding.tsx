import { motion } from "motion/react";
import { Card, CardContent, Button } from "@conductor/ui";
import { IconBrandGithub } from "@tabler/icons-react";
import { PLATFORM_SECTIONS } from "./WelcomeBanner";

export function EmptyOnboarding({ connectUrl }: { connectUrl: string }) {
  const steps = [
    { num: 1, label: "Connect GitHub", active: true },
    { num: 2, label: "Select a repo", active: false },
    { num: 3, label: "Start building", active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center px-4 py-12"
    >
      <div className="mb-12 flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                step.active
                  ? "bg-primary text-background ring-2 ring-primary/25 ring-offset-1 ring-offset-background"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step.num}
            </div>
            <span
              className={`whitespace-nowrap text-xs ${
                step.active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-px w-8 flex-shrink-0 ${
                  i === 0
                    ? "bg-gradient-to-r from-primary/40 to-border"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-10 flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute h-20 w-20 rounded-full bg-primary/10 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-primary/15">
            <IconBrandGithub size={26} className="text-primary" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          Connect your GitHub
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Link your repositories to unlock Eva's AI tools for planning, coding,
          and shipping features autonomously.
        </p>
        <Button
          asChild
          className="bg-foreground px-6 font-medium text-background hover:scale-[1.01] active:scale-[0.99]"
        >
          <a href={connectUrl}>
            <IconBrandGithub size={16} />
            Connect GitHub
          </a>
        </Button>
      </div>

      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          What you&apos;ll get access to
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLATFORM_SECTIONS.map((section, index) => (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 + index * 0.06 }}
            >
              <Card className="ui-surface-strong h-full overflow-hidden">
                <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
                <CardContent className="p-3">
                  <section.icon size={16} className="mb-2 text-primary" />
                  <p className="text-xs font-medium text-foreground">
                    {section.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {section.longDesc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

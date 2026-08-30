import {
  SlideShell,
  SlideReveal,
  SlideKicker,
  SlideTitle,
  SlideBullets,
  SlideStagger,
  SlideItem,
} from "../_components/SlideShell";

export function Slide07PRs() {
  return (
    <SlideShell className="bg-background">
      <SlideReveal>
        <SlideKicker>Pull Requests</SlideKicker>
      </SlideReveal>
      <SlideReveal delay={0.1}>
        <SlideTitle>Ship without friction</SlideTitle>
      </SlideReveal>
      <SlideStagger step={1} delayChildren={0.2}>
        <SlideItem>
          <SlideBullets
            items={[
              "One-click PR creation from any task",
              "Automatic branch naming and commit messages",
              "Review diffs, CI status, and merge — all in Eva",
            ]}
          />
        </SlideItem>
      </SlideStagger>
    </SlideShell>
  );
}

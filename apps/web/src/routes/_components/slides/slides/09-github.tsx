import {
  SlideShell,
  SlideReveal,
  SlideKicker,
  SlideTitle,
  SlideBullets,
  SlideStagger,
  SlideItem,
} from "../_components/SlideShell";

export function Slide09GitHub() {
  return (
    <SlideShell className="bg-background">
      <SlideReveal>
        <SlideKicker>GitHub Integration</SlideKicker>
      </SlideReveal>
      <SlideReveal delay={0.1}>
        <SlideTitle>Native GitHub flow</SlideTitle>
      </SlideReveal>
      <SlideStagger step={1} delayChildren={0.2}>
        <SlideItem>
          <SlideBullets
            items={[
              "GitHub App for secure repo access",
              "Clone, branch, commit, push — all automated",
              "Works with any GitHub org or personal account",
            ]}
          />
        </SlideItem>
      </SlideStagger>
    </SlideShell>
  );
}

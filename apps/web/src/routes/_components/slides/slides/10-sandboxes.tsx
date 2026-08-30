import {
  SlideShell,
  SlideReveal,
  SlideKicker,
  SlideTitle,
  SlideBullets,
  SlideStagger,
  SlideItem,
} from "../_components/SlideShell";

export function Slide10Sandboxes() {
  return (
    <SlideShell className="bg-background">
      <SlideReveal>
        <SlideKicker>Sandboxes</SlideKicker>
      </SlideReveal>
      <SlideReveal delay={0.1}>
        <SlideTitle>Isolated execution</SlideTitle>
      </SlideReveal>
      <SlideStagger step={1} delayChildren={0.2}>
        <SlideItem>
          <SlideBullets
            items={[
              "Vercel-powered sandboxes for every task",
              "Full Linux environment with shell access",
              "Safe to experiment — nothing touches prod",
            ]}
          />
        </SlideItem>
      </SlideStagger>
    </SlideShell>
  );
}

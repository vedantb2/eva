import {
  SlideShell,
  SlideKicker,
  SlideBody,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide06Documents() {
  return (
    <SlideShell>
      <SlideKicker>Documents</SlideKicker>
      <BlurWordsTitle lines={["Specs, notes, context.", "First-class."]} />
      <SlideBody className="mt-6 max-w-2xl">
        Eva reads your documents while working. No copy-pasting into prompts.
        Write it once, the agent knows what you're building.
      </SlideBody>
    </SlideShell>
  );
}

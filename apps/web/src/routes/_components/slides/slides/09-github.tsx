import {
  SlideShell,
  SlideKicker,
  SlideBody,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide09GitHub() {
  return (
    <SlideShell>
      <SlideKicker>GitHub integration</SlideKicker>
      <BlurWordsTitle lines={["Your repos.", "Your control."]} />
      <SlideBody className="mt-6 max-w-2xl">
        Eva connects via GitHub App. It clones your code, respects .gitignore,
        and pushes to branches. You control what it can access.
      </SlideBody>
    </SlideShell>
  );
}

import {
  SlideShell,
  SlideKicker,
  SlideBody,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide12Demo() {
  return (
    <SlideShell center>
      <SlideKicker>Demo</SlideKicker>
      <BlurWordsTitle lines={["Let's see it work."]} size="3xl" />
      <SlideBody className="mt-6 max-w-xl text-center">
        One quick task. Sandbox. Change. Tests. PR.
      </SlideBody>
    </SlideShell>
  );
}
